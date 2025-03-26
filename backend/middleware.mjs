import DOMPurify from "isomorphic-dompurify";
const AUTH_TOKEN_COOKIE_NAME = 'authToken'

export function responseFormatter (req, res, next) {
    res.setTokenCookie = (token) => {
        res.cookie(AUTH_TOKEN_COOKIE_NAME, token, {
            httpOnly: true,
            secure: true,
            partitioned: true,
            maxAge: 24 * 60 * 60 * 1000
        })
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

    req.getAuthToken = async () => {
        const cookieHeader = req.headers.cookie
        const cookies = cookieHeader
            ? Object.fromEntries(
                  cookieHeader.split('; ').map(cookie => cookie.split('='))
              )
            : {}

        const authToken = cookies[AUTH_TOKEN_COOKIE_NAME]
        if (!authToken) {
            return null
        }

        const jsonwebtoken = await import('jsonwebtoken') // must use dynamic import on commonjs module - hence the .default too
        const decoded = jsonwebtoken.default.verify(authToken, process.env.jwt_secret)
        return decoded
    }

    next()
}

export function sanitiseInput(req, res, next) {
    if (!req.body) {
        return
    }

    for (const key in req.body) {
        req.body[key] = DOMPurify.sanitize(req.body[key])
    }

    next()
}

