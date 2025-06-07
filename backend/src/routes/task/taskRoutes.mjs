import { Router } from "express"
import { projectColumnAccessControl, taskAccessControl } from "../../accessControl/attributeAccess.mjs"
import { authenticate, validate } from "../../middleware.mjs"
import { createRoleAccessControl } from "../../accessControl/roleAccess.mjs"
import {
    addTagSchema,
    createChecklistSchema,
    createCommnentSchema,
    createTaskSchema,
    deleteChecklistSchema,
    deleteCommentSchema,
    idSchema,
    updateChecklistSchema,
    updateCommentSchema,
    updateTaskSchema,
    updateTasksProjectColumn
} from "./taskSchema.mjs"
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
    deleteTaskEndpoint,
    tasksUpdateProjectColumnEndpoint,
    addTagToTaskEndpoint
} from "./taskController.mjs"

const router = Router()
router.use(authenticate)

router.get('/:taskId', validate(idSchema), taskAccessControl, taskEndpoint)
router.post('/', validate(createTaskSchema), projectColumnAccessControl, createTaskEndpoint)
router.patch('/:taskId', validate(updateTaskSchema), createRoleAccessControl, taskAccessControl, updateTaskEndpoint)
router.delete('/:taskId', validate(idSchema), createRoleAccessControl, taskAccessControl, deleteTaskEndpoint)
router.post('/:taskId/checklist', validate(createChecklistSchema), createRoleAccessControl, taskAccessControl, createChecklistEndpoint)
router.patch('/:taskId/checklist/:checklistId', validate(updateChecklistSchema), createRoleAccessControl, taskAccessControl, updateChecklistEndpoint)
router.delete('/:taskId/checklist/:checklistId', validate(deleteChecklistSchema), createRoleAccessControl, taskAccessControl, deleteChecklistEndpoint)
router.post('/:taskId/comment', validate(createCommnentSchema), taskAccessControl, createCommentEndpoint)
router.patch('/:taskId/comment/:commentId', validate(updateCommentSchema), taskAccessControl, updateCommentEndpoint)
router.delete('/:taskId/comment/:commentId', validate(deleteCommentSchema), taskAccessControl, deleteCommentEndpoint)
router.patch('/update-column-project/:projectColumnId', validate(updateTasksProjectColumn), tasksUpdateProjectColumnEndpoint)
router.post('/:taskId/tag/:tagId', validate(addTagSchema), createRoleAccessControl, taskAccessControl, addTagToTaskEndpoint)

export default router

