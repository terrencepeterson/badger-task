import { Router } from "express"
import { projectColumnAccessControl, taskAccessControl } from "../../accessControl/attributeAccess.mjs"
import { authenticate, validate } from "../../middleware.mjs"
import { createRoleAccessControl } from "../../accessControl/roleAccess.mjs"
import { createChecklistSchema, createCommnentSchema, createTaskSchema, getTaskSchema, updateChecklistSchema, updateCommentSchema, updateTaskSchema } from "./taskSchema.mjs"
import {
    createTaskEndpoint,
    taskEndpoint,
    updateTaskEndpoint,
    createChecklistEndpoint,
    createCommentEndpoint,
    updateChecklistEndpoint,
    updateCommentEndpoint
} from "./taskController.mjs"

const router = Router()
router.use(authenticate)

router.get('/:taskId', validate(getTaskSchema), taskAccessControl, taskEndpoint)
router.post('/', validate(createTaskSchema), projectColumnAccessControl, createTaskEndpoint)
router.put('/:taskId', validate(updateTaskSchema), createRoleAccessControl, taskAccessControl, updateTaskEndpoint)
router.post('/:taskId/checklist', validate(createChecklistSchema), createRoleAccessControl, taskAccessControl, createChecklistEndpoint)
router.post('/:taskId/comment', validate(createCommnentSchema), taskAccessControl, createCommentEndpoint)
router.put('/:taskId/checklist/:checklistId', validate(updateChecklistSchema), createRoleAccessControl, taskAccessControl, updateChecklistEndpoint)
router.put('/:taskId/comment/:commentId', validate(updateCommentSchema), taskAccessControl, updateCommentEndpoint)

export default router

