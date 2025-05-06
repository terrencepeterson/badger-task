import '@dotenvx/dotenvx/config'
import bcrypt from "bcryptjs"
import isEmail from 'validator/lib/isEmail.js'
import isStrongPassword from 'validator/lib/isStrongPassword.js'
import { getUserEmails, createUser, getUserByEmail } from "../db.mjs"
import { createEndpoint, formatDefaultableInput, formatNullableInput } from "./utility.mjs"
import { loggedOut } from '../standarisedResponses.mjs'
import { cookieSettings } from "../middleware.mjs"
import { addAccessControls, removeAccessControl } from "./attributeAccess.mjs"
import { ROLE_MEMBER } from './definitions.mjs'

export const signupEndpoint = createEndpoint(async ({ body }) => {
    const { name, email, password, confirmPassword } = body // required fields
    const description = formatNullableInput(body.description)
    const imgUrl = formatDefaultableInput(body.imgUrl)

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
        throw new Error('Missing field, please enter values for all required fields')
    }

    if (password !== confirmPassword) {
        throw new Error('Passsword and confirm password do not match')
    }

    if (!isStrongPassword(password)) {
        throw new Error('Please enter a password that is at least 8 characters long and contains at least 1 uppercase letter, 1 symbol and 1 number')
    }

    if (!isEmail(email)) {
        throw new Error('Please enter a valid email')
    }

    const userEmails = await getUserEmails()
    if (userEmails.includes(email)) {
        throw new Error('A user already exists with the provided email, please use a different email address')
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = await createUser(name, email, description, ROLE_MEMBER, hash, imgUrl)

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

    if (!email.trim() || !password) {
        throw new Error('Please enter a email and password')
    }

    if (!isEmail(email)) {
        throw new Error('Please enter a valid email address')
    }

    const user = await getUserByEmail(email)
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

