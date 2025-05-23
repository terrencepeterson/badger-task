import { Router } from "express"
import { signupEndpoint, loginEndpoint, logoutEndpoint } from "./authController.mjs"
import { authenticate } from "../../middleware.mjs"

const router = Router()

router.post('/sign-up', signupEndpoint)
router.post('/login', loginEndpoint)
router.get('/logout', authenticate, logoutEndpoint)

export default router

