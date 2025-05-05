import { createEndpoint, dateIsInFuture, formatDefaultableInput, formatNullableInput, jsDateToSqlDate } from "./utility.mjs"
import {
    createOrganisation,
    belongsToOrganisation,
    getOrganisationIdByUserId,
    createProject,
    createProjectColumn,
    getProjectColumnColumns,
    getAgendaColumnColumns,
    createAgendaColumn,
    getProjectColumnRows,
    createTask,
    createComment
} from "../db.mjs"
import isHexColor from 'validator/lib/isHexColor.js'
import { getIsValidAssignee } from "./attributeAccess.mjs"

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

// access control already checks to see if user can access project_column
export const createTaskEndpoint = createEndpoint(async (req) => {
    let { name, description, projectRow, assignee, dueDate } = req.body
    const { id: userId } = req.user
    const projectColumnId = req.query.column
    const createdBy = userId
    description = formatNullableInput(description)
    assignee = formatNullableInput(assignee)

    if (!name) {
        throw new Error('Please provide a name')
    }

    assignee = 24
    if (assignee && !await getIsValidAssignee(assignee, projectColumnId)) {
        throw new Error('Invalid Assignee - they\'re not authorised to access the project that this task is being created in')
    }

    if (dueDate && !dateIsInFuture(dueDate)) {
        throw new Error('Invalid due date - please provide a date that is in the future')
    }
    dueDate = jsDateToSqlDate(dueDate)

    projectRow = parseInt(projectRow)
    if (isNaN(projectRow)) {
        const rows = await getProjectColumnRows(projectColumnId)
        projectRow = ++rows[0]
    }

    const taskId = await createTask(name, description, dueDate, projectRow, createdBy, assignee, projectColumnId)
    if (!taskId && taskId !== 0) {
        throw new Error('Failed to create task')
    }

    return { message: 'Successfully created task', taskId }
})

// access controls already check to see if use can access task
export const createCommentEndpoint = createEndpoint(async (req) => {
    const { id: createdBy } = req.user
    const { text } = req.body
    const { taskId } = req.query

    if (!text) {
        throw new Error('No text provided for comment')
    }

    const comment = await createComment(text, taskId, createdBy)

    if (!comment) {
        throw new Error('Failed to create comment')
    }

    return { message: 'Successfully created comment', comment }
})

