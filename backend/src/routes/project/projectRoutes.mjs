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
    createTagEndpoint,
    updateProjectColumnEndpoint,
    updateTagEndpoint,
    deleteTagEndpoint,
    deleteProjectColumnEndpoint,
    deleteProjecEndpoint
} from "./projectController.mjs"

import {
    createProjectColumnSchema,
    createProjectSchema,
    createTagSchema,
    deleteTagSchema,
    getProjectColumnSchema,
    projectIdSchema,
    updateProjectColumnSchema,
    updateProjectSchema,
    updateTagSchema
} from "./projectSchema.mjs"

const router = Router()
router.use(authenticate)

router.get('/:projectId', validate(projectIdSchema), projectAccessControl, getProjectEndpoint)
router.post('/', validate(createProjectSchema), createRoleAccessControl, createProjectEndpoint)
router.put('/:projectId', validate(updateProjectSchema), adminRoleAccessControl, projectAccessControl, updateProjectEndpoint)
router.delete('/:projectId', validate(projectIdSchema), adminRoleAccessControl, projectAccessControl, deleteProjecEndpoint)
router.get('/:projectId/column/:projectColumnId', validate(getProjectColumnSchema), projectColumnAccessControl, getProjectColumnEndpoint)
router.post('/:projectId/column', validate(createProjectColumnSchema), createRoleAccessControl, projectAccessControl, createProjectColumnEndpoint)
router.put('/:projectId/column/:projectColumnId', validate(updateProjectColumnSchema), projectColumnAccessControl, updateProjectColumnEndpoint)
router.delete('/:projectId/column/:projectColumnId', validate(updateProjectColumnSchema), projectColumnAccessControl, deleteProjectColumnEndpoint)
router.post('/:projectId/tag', validate(createTagSchema) , createRoleAccessControl, projectAccessControl, createTagEndpoint)
router.put('/:projectId/tag/:tagId', validate(updateTagSchema), createRoleAccessControl, projectAccessControl, updateTagEndpoint)
router.delete('/:projectId/tag/:tagId', validate(deleteTagSchema), createRoleAccessControl, projectAccessControl, deleteTagEndpoint)

export default router

