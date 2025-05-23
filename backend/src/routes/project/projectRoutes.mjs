import { Router } from "express"
import { projectAccessControl, projectColumnAccessControl } from "../../accessControl/attributeAccess.mjs"
import { authenticate } from "../../middleware.mjs"
import { createRoleAccessControl, adminRoleAccessControl } from "../../accessControl/roleAccess.mjs"
import {
    createProjectEndpoint,
    getProjectEndpoint,
    updateProjectEndpoint,
    getProjectColumnEndpoint,
    createProjectColumnEndpoint,
    createTagEndpoint
} from "./projectController.mjs"

const router = Router()
router.use(authenticate)

router.get('/:projectId', projectAccessControl, getProjectEndpoint)
router.post('/', createRoleAccessControl, createProjectEndpoint)
router.put('/:projectId', adminRoleAccessControl, projectAccessControl, updateProjectEndpoint)
router.get('/column/:projectColumnId', projectColumnAccessControl, getProjectColumnEndpoint)
router.post('/column', createRoleAccessControl, projectAccessControl, createProjectColumnEndpoint)
router.post('/tag', createRoleAccessControl, projectAccessControl, createTagEndpoint)

export default router

