import { ROLE_VIEW } from "./definitions.mjs"

export function createRoleAccessControl(req, res, next) {
    if (req.user.role === ROLE_VIEW) {
        res.error('You don\'t have the correct permisions', 403)
        return
    }

    next()
}

