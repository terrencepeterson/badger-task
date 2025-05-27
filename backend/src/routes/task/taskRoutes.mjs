import { Router } from "express"
import { projectColumnAccessControl, taskAccessControl } from "../../accessControl/attributeAccess.mjs"
import { createTaskEndpoint, taskEndpoint, updateTaskEndpoint, createChecklistEndpoint, createCommentEndpoint } from "./taskController.mjs"
import { authenticate, validate } from "../../middleware.mjs"
import { createRoleAccessControl } from "../../accessControl/roleAccess.mjs"
import { createChecklistSchema, createCommnentSchema, createTaskSchema, getTaskSchema, updateTaskSchema } from "./taskSchema.mjs"

const router = Router()
router.use(authenticate)

router.get('/:taskId', validate(getTaskSchema), taskAccessControl, taskEndpoint)
router.post('/', validate(createTaskSchema), projectColumnAccessControl, createTaskEndpoint)
router.put('/:taskId', validate(updateTaskSchema), createRoleAccessControl, taskAccessControl, updateTaskEndpoint)
router.post('/:taskId/checklist', validate(createChecklistSchema), createRoleAccessControl, taskAccessControl, createChecklistEndpoint)
router.post('/:taskId/comment', validate(createCommnentSchema), taskAccessControl, createCommentEndpoint)

export default router

