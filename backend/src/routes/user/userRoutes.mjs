import { Router } from "express"
import { dashboardEndpoint } from "./userController.mjs"
import { authenticate, validate } from "../../middleware.mjs"
import { dashboardSchema } from "./userSchema.mjs"

const router = Router()

router.get('/dashboard', validate(dashboardSchema), authenticate, dashboardEndpoint)

export default router

