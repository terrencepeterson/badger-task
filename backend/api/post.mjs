import { createEndpoint } from "./utility.mjs"
import { createOrganisation, belongsToOrganisation, getOrganisationIdByUserId, createProject } from "../db.mjs"
import { ROLE_VIEW } from "./definitions.mjs"

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

export const createProjectEndpoint = createEndpoint(async (req) => {
    const { id: userId, role: userRole } = req.user

    if (userRole === ROLE_VIEW) {
        throw new Error('You don\'t have permission to create a project')
    }

    const organisationId = await getOrganisationIdByUserId(userId)
    const name = req.body.name.trim()
    let description = req.body.description.trim()
    description = description || 'NULL'
    const isPrivate = !!req.body.isPrivate

    if (!organisationId && organisationId !== 0) {
        throw new Error('You don\'t belong to an organisation')
    }

    if (!name) {
        throw new Error('Please provide a name')
    }

    const projectId = await createProject(userId, organisationId, name, description, isPrivate)
    if (!projectId && projectId !== 0) {
        throw new Error('Failed to add project')
    }

    return { message: 'Successfully added project', projectId }
})

