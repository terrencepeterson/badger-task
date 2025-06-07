import { Router } from "express"
import { addOrganisationImageEndpoint, createOrganisationEndpoint, updateOrganisationEndpoint } from "./organsationController.mjs"
import { organisationAccessControl } from "../../accessControl/attributeAccess.mjs"
import { authenticate, validate, imageUpload } from "../../middleware.mjs"
import { adminRoleAccessControl } from "../../accessControl/roleAccess.mjs"
import { createOrganisationSchema, organisationIdSchema, updateOrganiationSchema } from "./organisationSchema.mjs"
import { imageFileSchema } from '../../validation.mjs'

const router = Router()
router.use(authenticate)

router.post('/', validate(createOrganisationSchema), createOrganisationEndpoint)
router.patch('/:organisationId', validate(updateOrganiationSchema), adminRoleAccessControl, organisationAccessControl, updateOrganisationEndpoint)
router.post('/:organisationId/avatar', validate(organisationIdSchema), organisationAccessControl, imageUpload, validate(imageFileSchema), addOrganisationImageEndpoint)

export default router

