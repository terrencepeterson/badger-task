import { createEndpoint, createImageEndpoint, createPatchEndpoint } from "../../utility.mjs"
import { ACCESS_CONTROL_ORGANISATION, AVATAR_IMAGE_TYPE, ORGANISATION_TABLE } from "../../definitions.mjs"
import { belongsToOrganisation, createOrganisation } from "./organisationService.mjs"
import { addMultipleAttributeAccess } from "../../accessControl/attributeAccess.mjs"

export const updateOrganisationEndpoint = createPatchEndpoint(
    false,
    ORGANISATION_TABLE,
    'organisationId'
)

export const createOrganisationEndpoint = createEndpoint(async (req) => {
    const { id: userId } = req.user

    if (await belongsToOrganisation(userId)) {
        throw new Error('Please create a new account, the current account already belongs to an organisation')
    }

    const organisationId = await createOrganisation(userId, req.body.name)
    if (!organisationId && organisationId !== 0) {
        throw new Error('Failed to add organisation - could not update user')
    }

    addMultipleAttributeAccess([userId], ACCESS_CONTROL_ORGANISATION, organisationId)

    return { message: "Successfully added organisation", organisationId }
})

export const addOrganisationImageEndpoint = createImageEndpoint(ORGANISATION_TABLE, 'organisationId', AVATAR_IMAGE_TYPE)

