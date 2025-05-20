import { ROLE_ADMIN, ROLE_MEMBER } from "./definitions.mjs"

export const adminRoleAccessControl = createRoleAccessControlMiddleware(ROLE_ADMIN)
export const createRoleAccessControl = createRoleAccessControlMiddleware([ROLE_MEMBER, ROLE_ADMIN])

function createRoleAccessControlMiddleware(roles) {
    return function(req, res, next) {
        if (!Array.isArray(roles)) {
            roles = [roles]
        }

        for (const role of roles) {
            if (req.user.role === role) {
                next()
                return
            }
        }

        res.error('You don\'t have the correct permisions', 403)
    }
}

