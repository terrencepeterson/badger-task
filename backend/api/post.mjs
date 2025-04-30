import { createEndpoint } from "./utility.mjs"
import { createOrganisation, belongsToOrganisation, getOrganisationIdByUserId, createProject } from "../db.mjs"
const VIEW_ROLE = 'viewer'
const MANIPULATE_ROLE = 'member'
const ADMIN_ROLE = 'admin'

export const createOrganisationEndpoint = createEndpoint(async (req) => {
    const { id: userId } = req.user

    if (userId === undefined || userId === null) {
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

    const organisationId = await createOrganisation(userId, name)
    if (!organisationId && organisationId !== 0) {
        throw new Error('Failed to add organisation - could not update user')
    }

    return { message: "Successfully added organisation", organisationId }
})

export const createProjectEndpoint = createEndpoint(async (req) => {
    const { id: userId, role: userRole } = req.user

    if (userId === undefined || userId === null) {
        throw new Error('Please login to create an organisation')
    }

    if (userRole === VIEW_ROLE) {
        throw new Error('You don\'t have permission to create a project')
    }

    const organisationId = await getOrganisationIdByUserId(userId)
    const name = req.body.name.trim()
    let description = req.body.description.trim()
    description = description || 'NULL'
    const isPrivate = !!req.body.isPrivate

    const hasCreatedProject = await createProject(userId, organisationId, name, description, isPrivate)
    if (!hasCreatedProject) {
        throw new Error('Failed to add project')
    }

    return 'Successfully added project'
})

