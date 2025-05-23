import { Router } from "express"
import { createOrganisationEndpoint, editOrganisationEndpoint } from "./organsationController.mjs"
import { organisationAccessControl } from "../../accessControl/attributeAccess.mjs"
import { authenticate } from "../../middleware.mjs"
import { adminRoleAccessControl } from "../../accessControl/roleAccess.mjs"

const router = Router()
router.use(authenticate)

router.post('/', createOrganisationEndpoint)
router.put('/:organisationId', adminRoleAccessControl, organisationAccessControl, editOrganisationEndpoint)

export default router

