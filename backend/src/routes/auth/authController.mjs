import '@dotenvx/dotenvx/config'
import bcrypt from "bcryptjs"
import { createUser, getUserByEmail } from "./authService.mjs"
import { createEndpoint } from "../../utility.mjs"
import { loggedOut } from '../../standarisedResponses.mjs'
import { cookieSettings } from "../../middleware.mjs"
import { addAccessControls, removeAccessControl } from "../../accessControl/attributeAccess.mjs"
import { ROLE_MEMBER } from '../../definitions.mjs'

export const signupEndpoint = createEndpoint(async ({ body }) => {
    const { name, email, password, confirmPassword, description } = body // required fields

    if (password !== confirmPassword) {
        throw new Error('Passsword and confirm password do not match')
    }

    if (await getUserByEmail(email)) {
        throw new Error('A user already exists with the provided email, please use a different email address')
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await createUser(name, email, description, ROLE_MEMBER, hashedPassword)
    if (!user) {
        throw new Error('Failed to create user')
    }

    return user
}, false)

export const loginEndpoint = createEndpoint(async (req, res) => {
    const { email, password } = req.body

    let authToken
    try {
        authToken = await res.getAuthToken()
    } catch(e) {
        // if no auth token an error will get thrown but we don't
        // want to do anything with the error
    }

    if (authToken) {
        throw new Error('An account is already logged in')
    }

    // i still validate the email and password in here rather than with zod
    // i would have had to use super refine and attach the user data to the context
    // and then put that back onto req body... not worth it here
    const user = await getUserByEmail(email, true)
    if (!user) {
        throw new Error('Account does not exist, please sign up or contact administration')
    }

    const matchedPassword = await bcrypt.compare(password, user.password)
    if (!matchedPassword) {
        throw new Error('Incorrect password')
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
        return 'Successfully logged in!'
    } catch(e) {
        throw new Error('Currently unable to login')
    }
}, false)

export const logoutEndpoint = createEndpoint((req, res) => {
    removeAccessControl(req.user.id)
    res.clearCookie(process.env.auth_token_cookie_name, cookieSettings)
    return loggedOut
})

