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

router.get('/', projectAccessControl, getProjectEndpoint)
router.post('/',  authenticate, createRoleAccessControl, createProjectEndpoint)
router.put('/', adminRoleAccessControl, projectAccessControl, updateProjectEndpoint)
router.get('/column', projectColumnAccessControl, getProjectColumnEndpoint)
router.post('/column',  authenticate, createRoleAccessControl, projectAccessControl, createProjectColumnEndpoint)
router.post('/tag', authenticate, createRoleAccessControl, projectAccessControl, createTagEndpoint)

export default router

