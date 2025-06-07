import { Router } from "express"
import { projectAccessControl, projectColumnAccessControl } from "../../accessControl/attributeAccess.mjs"
import { authenticate, imageUpload, validate } from "../../middleware.mjs"
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
    deleteProjecEndpoint,
    updateProjectImageEndpoint
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
import { imageFileSchema } from "../../validation.mjs"

const router = Router()
router.use(authenticate)

router.get('/:projectId', validate(projectIdSchema), projectAccessControl, getProjectEndpoint)
router.post('/', validate(createProjectSchema), createRoleAccessControl, createProjectEndpoint)
router.patch('/:projectId', validate(updateProjectSchema), adminRoleAccessControl, projectAccessControl, updateProjectEndpoint)
router.delete('/:projectId', validate(projectIdSchema), adminRoleAccessControl, projectAccessControl, deleteProjecEndpoint)
router.get('/:projectId/column/:projectColumnId', validate(getProjectColumnSchema), projectColumnAccessControl, getProjectColumnEndpoint)
router.post('/:projectId/column', validate(createProjectColumnSchema), createRoleAccessControl, projectAccessControl, createProjectColumnEndpoint)
router.patch('/:projectId/column/:projectColumnId', validate(updateProjectColumnSchema), projectColumnAccessControl, updateProjectColumnEndpoint)
router.delete('/:projectId/column/:projectColumnId', validate(updateProjectColumnSchema), projectColumnAccessControl, deleteProjectColumnEndpoint)
router.post('/:projectId/tag', validate(createTagSchema) , createRoleAccessControl, projectAccessControl, createTagEndpoint)
router.patch('/:projectId/tag/:tagId', validate(updateTagSchema), createRoleAccessControl, projectAccessControl, updateTagEndpoint)
router.delete('/:projectId/tag/:tagId', validate(deleteTagSchema), createRoleAccessControl, projectAccessControl, deleteTagEndpoint)
router.post('/:projectId/avatar', validate(projectIdSchema), createRoleAccessControl, projectAccessControl, imageUpload, validate(imageFileSchema), updateProjectImageEndpoint)

export default router

