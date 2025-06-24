import { Router } from "express"
import { signupEndpoint, loginEndpoint, logoutEndpoint, userEndpoint } from "./authController.mjs"
import { authenticate, validate } from "../../middleware.mjs"
import { loginSchema, signupSchema } from "./authSchema.mjs"

const router = Router()

router.post('/sign-up', validate(signupSchema), signupEndpoint)
router.post('/log-in', validate(loginSchema), loginEndpoint)
router.get('/logout', authenticate, logoutEndpoint)
router.get('/user', authenticate, userEndpoint)

export default router

