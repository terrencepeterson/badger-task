import { createEndpoint, createPutEndpoint } from "../../utility.mjs"
import { ORGANISATION_TABLE } from "../../definitions.mjs"
import { belongsToOrganisation, createOrganisation } from "./organisationService.mjs"

export const editOrganisationEndpoint = createPutEndpoint(
    organisationFormatAndValidation,
    ['name'],
    ORGANISATION_TABLE,
    'organisationId'
)

function organisationFormatAndValidation(allowedData, organsiationId, userId) {
    if (Object.hasOwn(allowedData, 'name') && !allowedData.name && allowedData.name !== 0) {
        throw new Error('Invalid organisation name - please provide a value')
    }

    return allowedData
}

export const createOrganisationEndpoint = createEndpoint(async (req) => {
    const { id: userId } = req.user
    const { name } = req.body

    if (await belongsToOrganisation(userId)) {
        throw new Error('Please create a new account, the current account already belongs to an organisation')
    }

    if (!name) {
        throw new Error('Pleasae provide a name')
    }

    const organisationId = await createOrganisation(userId, name)
    if (!organisationId && organisationId !== 0) {
        throw new Error('Failed to add organisation - could not update user')
    }

    return { message: "Successfully added organisation", organisationId }
})

