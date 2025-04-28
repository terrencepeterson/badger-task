import { createEndpoint } from "./utility.mjs"
import { addOrganisation, belongsToOrganisation } from "../db.mjs"

export const createOrganisationEndpoint = createEndpoint(async (req) => {
    const { id: userId } = req.user

    if (!userId) {
        throw new Error('Please login to create an organisation')
    }

    // check to see if the email already exists in the db
    if (await belongsToOrganisation(userId)) {
        throw new Error('Please create a new account, the current account already belongs to an organisation')
    }

    const { name } = req.body

    if (!name) {
        throw new Error('Pleasae provide a name')
    }

    const hasAddedOrganisation = await addOrganisation(userId, name)
    if (hasAddedOrganisation) {
        return "Successfully added organisation"
    }
})

