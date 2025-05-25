import { Router } from "express"
import { createOrganisationEndpoint, updateOrganisationEndpoint } from "./organsationController.mjs"
import { organisationAccessControl } from "../../accessControl/attributeAccess.mjs"
import { authenticate, validate } from "../../middleware.mjs"
import { adminRoleAccessControl } from "../../accessControl/roleAccess.mjs"
import { createOrganisationSchema, updateOrganiationSchema } from "./organisationSchema.mjs"

const router = Router()
router.use(authenticate)

router.post('/', validate(createOrganisationSchema), createOrganisationEndpoint)
router.put('/:organisationId', validate(updateOrganiationSchema), adminRoleAccessControl, organisationAccessControl, updateOrganisationEndpoint)

export default router

