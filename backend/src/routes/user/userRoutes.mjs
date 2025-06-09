import { Router } from "express"
import { dashboardEndpoint, updatePasswordEndpoint, updateUserAvatarEndpoint, updateUserBackgroundEndpoint, updateUserEndpoint } from "./userController.mjs"
import { authenticate, imageUpload, validate } from "../../middleware.mjs"
import { dashboardSchema, updatePasswordSchema, updateUserSchema, userIdSchema } from "./userSchema.mjs"
import { imageFileSchema } from "../../validation.mjs"

const router = Router()

router.get('/dashboard', validate(dashboardSchema), authenticate, dashboardEndpoint)
router.patch('/:userId/password', validate(updatePasswordSchema), authenticate, updatePasswordEndpoint)
router.post('/:userId/avatar', validate(userIdSchema), authenticate, imageUpload, validate(imageFileSchema), updateUserAvatarEndpoint)
router.post('/:userId/backgroundImage', validate(userIdSchema), authenticate, imageUpload, validate(imageFileSchema), updateUserBackgroundEndpoint)
router.patch('/:userId', validate(updateUserSchema), authenticate, updateUserEndpoint)

export default router

