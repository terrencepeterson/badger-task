import { createEndpoint, formatDefaultableInput, formatNullableInput } from "./utility.mjs"
import { createOrganisation, belongsToOrganisation, getOrganisationIdByUserId, createProject, createProjectColumn, getProjectColumnColumns, getAgendaColumnColumns, createAgendaColumn } from "../db.mjs"
import isHexColor from 'validator/lib/isHexColor.js'

const VALID_PROJECT_COLUMN_ICONS = ['wave', 'email', 'question', 'issue', 'home', 'computer', 'photo', 'music', 'tv', 'completed', 'idea', 'agenda', 'website', 'decision']

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
    let { name, description, imgUrl, isPrivate } = req.body

    const organisationId = await getOrganisationIdByUserId(userId)
    description = formatNullableInput(description)
    imgUrl = formatDefaultableInput(imgUrl)
    isPrivate = !!isPrivate

    if (!organisationId && organisationId !== 0) {
        throw new Error('You don\'t belong to an organisation')
    }

    if (!name) {
        throw new Error('Please provide a name')
    }

    const projectId = await createProject(userId, organisationId, name, description, isPrivate, imgUrl)
    if (!projectId && projectId !== 0) {
        throw new Error('Failed to add project')
    }

    return { message: 'Successfully added project', projectId }
})

// accesss control middleware already checks to see if user can access project
export const createProjectColumnEndpoint = createEndpoint(async (req) => {
    let { name, icon, colour, column } = req.body
    const projectId = parseInt(req.query.projectId)

    if (!name) {
        throw new Error('Please provide a name')
    }

    if (!VALID_PROJECT_COLUMN_ICONS.includes(icon)) {
        throw new Error('Invalid icon')
    }

    if (!isHexColor(colour)) {
        throw new Error('Invalid colour')
    }

    column = parseInt(column)
    if (isNaN(column)) {
        const currentColumns = await getProjectColumnColumns(projectId)
        column = ++currentColumns[0] // currentColumns always returns with highest column first
    }

    const projectColumnId = await createProjectColumn(name, icon, colour, column, projectId)
    if (!projectColumnId && projectColumnId !== 0) {
        throw new Error('Failed to create project column')
    }

    return { message: 'Successfully created project column', projectColumnId }
})

export const createAgendaColumnEndpoint = createEndpoint(async (req) => {
    const { id: userId } = req.user
    let { name, colour, column } = req.body

    if (!name) {
        throw new Error('Please provide a name')
    }

    if (!isHexColor(colour)) {
        throw new Error('Invalid colour')
    }

    column = parseInt(column)
    if (isNaN(column)) {
        const currentColumns = await getAgendaColumnColumns(userId)
        column = ++currentColumns[0] // currentColumns always returns with highest column first
    }

    const agendaColumnId = await createAgendaColumn(name, colour, column, userId)
    if (!agendaColumnId && agendaColumnId !== 0) {
        throw new Error('Failed to create agenda column')
    }

    return { message: 'Successfully created agenda column', agendaColumnId }
})

