import { ZodError } from "zod/v4"
import DOMPurify from "isomorphic-dompurify"
import { unauthenticated } from "./standarisedResponses.mjs"
const UNSANITARISABLE_FIELDS = []
export const cookieSettings = {
    httpOnly: true,
    secure: true,
    partitioned: true
}
import '@dotenvx/dotenvx/config'
const multer = await import('multer')
const upload = multer.default({ dest: `${process.env.backend_root}/uploads` })
export const imageUpload = upload.single('image_file')

export function responseFormatter(req, res, next) {
    res.setTokenCookie = (token) => {
        // seperated this out as when clearing cookie you don't need maxAge
        const maxAgeSetting = { maxAge: 24 * 60 * 60 * 1000 }
        Object.assign(maxAgeSetting, cookieSettings)
        res.cookie(process.env.auth_token_cookie_name, token, maxAgeSetting)
    }

    res.success = (data, metadata = {}) => {
        res.status(200).json({
            status: 'success',
            data,
            metadata
        })
    }

    res.error = (message, code = 400, details = {}) => {
        res.status(code).json({
            status: 'error',
            error: {
                code,
                message,
                details
            },
            metadata: {
                timestamp: new Date().toISOString(),
            }
        })
    }

    res.getAuthToken = async () => {
        const cookieHeader = req.headers.cookie
        const cookies = cookieHeader
            ? Object.fromEntries(
                cookieHeader.split('; ').map(cookie => cookie.split('='))
            )
            : {}

        const authToken = cookies[process.env.auth_token_cookie_name]
        if (!authToken) {
            throw new Error('Unauthenticaed please login')
        }

        const jsonwebtoken = await import('jsonwebtoken') // must use dynamic import on commonjs module - hence the .default too
        const decoded = jsonwebtoken.default.verify(authToken, process.env.jwt_secret)
        return decoded
    }

    next()
}

export function sanitiseInput(req, res, next) {
    const sanitiseTypes = ['body', 'params', 'query']
    const containMalaciousCode = (value, key) => {
        if (UNSANITARISABLE_FIELDS.includes(key) || typeof value !== 'string') {
            return false
        }

        const clean = DOMPurify.sanitize(value, { USE_PROFILES: { html: true } })

        if (value !== clean) {
            res.error('Malacious content provided', 400)
            return true
        }

        return false
    }

    for (const type of sanitiseTypes) {
        for (const name in req[type]) {
            const value = req[type][name]
            if (containMalaciousCode(value, name)) {
                return
            }
        }
    }

    next()
}

export async function authenticate(req, res, next) {
    let authToken
    try {
        authToken = await res.getAuthToken()
        req.user = {
            id: authToken.id,
            role: authToken.role
        }
        next()
    } catch (e) {
        res.error(e.message, unauthenticated.code, { redirect: true, url: unauthenticated.url })
        req.user = null // not sure if necessary here but i feel hacker could send a user property in the request
        return
    }
}

export function validate(schemas) {
    return async function(req, res, next) {
        for (const [key, schema] of Object.entries(schemas)) {
            try {
                req[key] = await schema.parseAsync(req[key])
            } catch (err) {
                console.log(err)
                if (err instanceof ZodError) {
                    const invalidInputs = err.issues.map(e => e.path[0]).join(', ')
                    const errors = err.issues.map(e => `${e.path[0]}: ${e.message}`)
                    return res.error(`Invalid data, please provide the correct data for: ${invalidInputs}`, 400, errors)
                }

                return res.error('Internal server error', 500)
            }
        }
        next()
    }
}

