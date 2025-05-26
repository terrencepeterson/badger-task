import { Router } from "express"
import { signupEndpoint, loginEndpoint, logoutEndpoint } from "./authController.mjs"
import { authenticate, validate } from "../../middleware.mjs"
import { loginSchema, signupSchema } from "./authSchema.mjs"

const router = Router()

router.post('/sign-up', validate(signupSchema), signupEndpoint)
router.post('/login', validate(loginSchema), loginEndpoint)
router.get('/logout', authenticate, logoutEndpoint)

export default router

