import { Router } from "express"
import { dashboardEndpoint } from "./userController.mjs"

const router = Router()

router.get('/dashboard', dashboardEndpoint)

export default router

