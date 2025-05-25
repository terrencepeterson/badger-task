import { createEndpoint, createPutEndpoint } from "../../utility.mjs"
import { ORGANISATION_TABLE } from "../../definitions.mjs"
import { belongsToOrganisation, createOrganisation } from "./organisationService.mjs"

export const updateOrganisationEndpoint = createPutEndpoint(
    organisationFormatAndValidation,
    ['name', 'imgUrl'],
    ORGANISATION_TABLE,
    'organisationId'
)

function organisationFormatAndValidation(allowedData, organsiationId, userId) {
    allowedData.img_url = allowedData.imgUrl
    delete allowedData.imgUrl

    return allowedData
}

export const createOrganisationEndpoint = createEndpoint(async (req) => {
    const { id: userId } = req.user

    if (await belongsToOrganisation(userId)) {
        throw new Error('Please create a new account, the current account already belongs to an organisation')
    }

    const organisationId = await createOrganisation(userId, req.body.name, req.body.imgUrl)
    if (!organisationId && organisationId !== 0) {
        throw new Error('Failed to add organisation - could not update user')
    }

    return { message: "Successfully added organisation", organisationId }
})

