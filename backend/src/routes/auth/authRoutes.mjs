import { Router } from "express"
import { signupEndpoint, loginEndpoint, logoutEndpoint } from "./authController.mjs"

const router = Router()

router.post('/sign-up', signupEndpoint)
router.post('/login', loginEndpoint)
router.get('/logout', logoutEndpoint)

export default router

