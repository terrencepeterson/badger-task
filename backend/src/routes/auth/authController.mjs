import '@dotenvx/dotenvx/config'
import bcrypt from "bcryptjs"
import { createUser, getUserByEmail, getUserById } from "./authService.mjs"
import { createEndpoint } from "../../utility.mjs"
import { loggedOut } from '../../standarisedResponses.mjs'
import { cookieSettings } from "../../middleware.mjs"
import { addAccessControls, removeAccessControl } from "../../accessControl/attributeAccess.mjs"
import { ROLE_MEMBER } from '../../definitions.mjs'
import EndpointError from '../../EndpointError.mjs'
import { getProjectsByUserId } from '../project/projectService.mjs'

export const signupEndpoint = createEndpoint(async ({ body }) => {
    const { name, email, password, confirmPassword, description } = body // required fields

    if (password !== confirmPassword) {
        throw new EndpointError({ type: EndpointError.validationErrorId, fields: {
            confirmPassword: 'Confirm Password must match the password'
        }})
    }

    if (await getUserByEmail(email)) {
        throw new EndpointError({
            type: EndpointError.validationErrorId,
            fields: {
                email: 'A user already exists with the provided email, please use a different email address'
            }
        })
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await createUser(name, email, description, ROLE_MEMBER, hashedPassword)
    if (!user) {
        throw new EndpointError({
            fields: {
                type: EndpointError.generalErrorId,
                user: 'Failed to create user'
            }
        })
    }

    return { message: 'successfully created user', redirectUrl: '/log-in', data: user }
}, false)

export const loginEndpoint = createEndpoint(async (req, res) => {
    const { email, password } = req.body

    let authToken
    try {
        authToken = await res.getAuthToken()
    } catch(e) {
        // if no auth token an error will get thrown but we don't want to do anything with the error
    }

    if (authToken) {
        throw new EndpointError({ message: 'An account is already logged in', type: EndpointError.generalErrorId, redirectUrl: '/app/dashboard' })
    }

    // i still validate the email and password in here rather than with zod
    // i would have had to use super refine and attach the user data to the context
    // and then put that back onto req body... not worth it here
    const user = await getUserByEmail(email, true)
    if (!user) {
        throw new EndpointError({
            message: 'Account does not exist, please sign up or contact administration',
            type: EndpointError.mixedErrorId,
            fields: { email: 'An account does not exist with that email'}
        })
    }

    const matchedPassword = await bcrypt.compare(password, user.password)
    if (!matchedPassword) {
        throw new EndpointError({ type: EndpointError.validationErrorId, fields: { password: 'Incorrect password' }})
    }

    try {
        const jsonwebtoken = await import('jsonwebtoken') // must use dynamic import on commonjs module - hence the .default too
        const token = jsonwebtoken.default.sign(
            { id: user.id, role: user.role },
            process.env.jwt_secret,
            { expiresIn: +process.env.auth_session_seconds } // must convert to int here as string without unit defaults to millieseconds
        )
        res.setTokenCookie(token)
        addAccessControls(user.id)
        return // purposefully don't send message here as the /user endpoint handles that
    } catch(e) {
        throw new EndpointError({ message: 'Currently unable to login', type: EndpointError.generalErrorId })
    }
}, false)

export const logoutEndpoint = createEndpoint((req, res) => {
    removeAccessControl(req.user.id)
    res.clearCookie(process.env.auth_token_cookie_name, cookieSettings)
    return loggedOut
})

export const userEndpoint = createEndpoint(async (req, res) => {
    const user = await getUserById(req.user.id)
    const projects = await getProjectsByUserId(req.user.id)
    user.projects = projects
    return { message: 'Successfully logged in', data: user }
})

