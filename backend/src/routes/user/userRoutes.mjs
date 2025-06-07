import { Router } from "express"
import { dashboardEndpoint, updateUserAvatarEndpoint, updateUserBackgroundEndpoint } from "./userController.mjs"
import { authenticate, imageUpload, validate } from "../../middleware.mjs"
import { dashboardSchema, userIdSchema } from "./userSchema.mjs"
import { imageFileSchema } from "../../validation.mjs"

const router = Router()

router.get('/dashboard', validate(dashboardSchema), authenticate, dashboardEndpoint)
router.post('/:userId/avatar', validate(userIdSchema), authenticate, imageUpload, validate(imageFileSchema), updateUserAvatarEndpoint)
router.post('/:userId/backgroundImage', validate(userIdSchema), authenticate, imageUpload, validate(imageFileSchema), updateUserBackgroundEndpoint)

export default router

