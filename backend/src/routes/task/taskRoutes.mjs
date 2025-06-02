import { Router } from "express"
import { projectColumnAccessControl, taskAccessControl } from "../../accessControl/attributeAccess.mjs"
import { authenticate, validate } from "../../middleware.mjs"
import { createRoleAccessControl } from "../../accessControl/roleAccess.mjs"
import { createChecklistSchema, createCommnentSchema, createTaskSchema, deleteChecklistSchema, deleteCommentSchema, idSchema, updateChecklistSchema, updateCommentSchema, updateTaskSchema } from "./taskSchema.mjs"
import {
    createTaskEndpoint,
    taskEndpoint,
    updateTaskEndpoint,
    createChecklistEndpoint,
    createCommentEndpoint,
    updateChecklistEndpoint,
    updateCommentEndpoint,
    deleteCommentEndpoint,
    deleteChecklistEndpoint,
    deleteTaskEndpoint
} from "./taskController.mjs"

const router = Router()
router.use(authenticate)

router.get('/:taskId', validate(idSchema), taskAccessControl, taskEndpoint)
router.post('/', validate(createTaskSchema), projectColumnAccessControl, createTaskEndpoint)
router.put('/:taskId', validate(updateTaskSchema), createRoleAccessControl, taskAccessControl, updateTaskEndpoint)
router.delete('/:taskId', validate(idSchema), createRoleAccessControl, taskAccessControl, deleteTaskEndpoint)
router.post('/:taskId/checklist', validate(createChecklistSchema), createRoleAccessControl, taskAccessControl, createChecklistEndpoint)
router.put('/:taskId/checklist/:checklistId', validate(updateChecklistSchema), createRoleAccessControl, taskAccessControl, updateChecklistEndpoint)
router.delete('/:taskId/checklist/:checklistId', validate(deleteChecklistSchema), createRoleAccessControl, taskAccessControl, deleteChecklistEndpoint)
router.post('/:taskId/comment', validate(createCommnentSchema), taskAccessControl, createCommentEndpoint)
router.put('/:taskId/comment/:commentId', validate(updateCommentSchema), taskAccessControl, updateCommentEndpoint)
router.delete('/:taskId/comment/:commentId', validate(deleteCommentSchema), taskAccessControl, deleteCommentEndpoint)

export default router

