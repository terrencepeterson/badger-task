import { Router } from "express"
import { dashboardEndpoint } from "./userController.mjs"
import { authenticate } from "../../middleware.mjs"

const router = Router()

router.get('/dashboard', authenticate, dashboardEndpoint)

export default router

