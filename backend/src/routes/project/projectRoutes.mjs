import { Router } from "express"
import { projectAccessControl, projectColumnAccessControl } from "../../accessControl/attributeAccess.mjs"
import { authenticate, validate } from "../../middleware.mjs"
import { createRoleAccessControl, adminRoleAccessControl } from "../../accessControl/roleAccess.mjs"

import {
    createProjectEndpoint,
    getProjectEndpoint,
    updateProjectEndpoint,
    getProjectColumnEndpoint,
    createProjectColumnEndpoint,
    createTagEndpoint
} from "./projectController.mjs"

import {
    createProjectColumnSchema,
    createProjectSchema,
    createTagSchema,
    getProjectColumnSchema,
    getProjectSchema,
    updateProjectSchema
} from "./projectSchema.mjs"

const router = Router()
router.use(authenticate)

router.get('/:projectId', validate(getProjectSchema), projectAccessControl, getProjectEndpoint)
router.post('/', validate(createProjectSchema), createRoleAccessControl, createProjectEndpoint)
router.put('/:projectId', validate(updateProjectSchema), adminRoleAccessControl, projectAccessControl, updateProjectEndpoint)
router.get('/:projectId/column/:projectColumnId', validate(getProjectColumnSchema), projectColumnAccessControl, getProjectColumnEndpoint)
router.post('/:projectId/column', validate(createProjectColumnSchema), createRoleAccessControl, projectAccessControl, createProjectColumnEndpoint)
router.post('/:projectId/tag', validate(createTagSchema) , createRoleAccessControl, projectAccessControl, createTagEndpoint)

export default router

