import { Router } from "express"
import { projectColumnAccessControl, taskAccessControl } from "../../accessControl/attributeAccess.mjs"
import { createTaskEndpoint, taskEndpoint, editTaskEndpoint, createChecklistEndpoint, createCommentEndpoint } from "./taskController.mjs"
import { authenticate } from "../../middleware.mjs"
import { createRoleAccessControl } from "../../accessControl/roleAccess.mjs"

const router = Router()
router.use(authenticate)

router.get('/:taskId', taskAccessControl, taskEndpoint)
router.post('/', projectColumnAccessControl, createTaskEndpoint)
router.put('/:taskId', createRoleAccessControl, taskAccessControl, editTaskEndpoint)
router.post('/checklist', createRoleAccessControl, taskAccessControl, createChecklistEndpoint)
router.post('/comment', taskAccessControl, createCommentEndpoint)

export default router

