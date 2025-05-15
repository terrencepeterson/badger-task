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
    createComment,
    createTag,
    createChecklist,
    updateUserProjectTable,
    getAllUsersFromOrganisation,
    getUserProjectAccess,
    getIdByDifferentId
} from "../db/db.mjs"
import isHexColor from 'validator/lib/isHexColor.js'
import { addAttributeAccess, addMultipleAttributeAccess, getIsValidAssignee } from "./attributeAccess.mjs"
import { ACCESS_CONTROL_COLUMN_AGENDA, ACCESS_CONTROL_COLUMN_PROJECTS, ACCESS_CONTROL_PROJECTS, ACCESS_CONTROL_TASKS, COLUMN_PROJECT_TABLE, ROLE_ADMIN, TASK_TABLE } from "./definitions.mjs"

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
    let accessControlUserIdsToUpdate
    const organisationId = await getOrganisationIdByUserId(userId)
    description = formatNullableInput(description)
    imgUrl = formatDefaultableInput(imgUrl)
    isPrivate = !!isPrivate

    if (isPrivate && userRole !== ROLE_ADMIN) { // non admin users cannot create private projects
        throw new Error('Unauthorised - only admin users can create private projects')
    }

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

    accessControlUserIdsToUpdate = isPrivate ?
        await updateUserProjectTable(organisationId, projectId) :
        await getAllUsersFromOrganisation(organisationId)

    await addMultipleAttributeAccess(accessControlUserIdsToUpdate, ACCESS_CONTROL_PROJECTS, projectId)

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
        column = currentColumns ? ++currentColumns[0] : 0 // currentColumns always returns with highest column first
    }

    const projectColumnId = await createProjectColumn(name, icon, colour, column, projectId)
    if (!projectColumnId && projectColumnId !== 0) {
        throw new Error('Failed to create project column')
    }

    const accesssUsers = await getUserProjectAccess(projectId)
    await addMultipleAttributeAccess(accesssUsers, ACCESS_CONTROL_COLUMN_PROJECTS, projectColumnId.toString())

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
        column = currentColumns.length ? ++currentColumns[0] : 0 // currentColumns always returns with highest column first
    }

    const agendaColumnId = await createAgendaColumn(name, colour, column, userId)
    if (!agendaColumnId && agendaColumnId !== 0) {
        throw new Error('Failed to create agenda column')
    }

    await addAttributeAccess(userId, ACCESS_CONTROL_COLUMN_AGENDA, agendaColumnId.toString())

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
        projectRow = rows.length ? ++rows[0] : 0
    }

    const taskId = await createTask(name, description, dueDate, projectRow, createdBy, assignee, projectColumnId)
    if (!taskId && taskId !== 0) {
        throw new Error('Failed to create task')
    }

    const projectId = await getIdByDifferentId('project_id', COLUMN_PROJECT_TABLE, 'id', projectColumnId)
    const accesssUsers = await getUserProjectAccess(projectId)
    await addMultipleAttributeAccess(accesssUsers, ACCESS_CONTROL_TASKS, taskId.toString())

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

// access controls already checks to see if user can access project
export const createTagEndpoint = createEndpoint(async (req) => {
    const { name, colour } = req.body
    const { projectId } = req.query

    if (!name) {
        throw new Error('No name provided')
    }

    if (!colour) {
        throw new Error('No colour provided')
    }

    if (!isHexColor(colour)) {
        throw new Error('The colour provided is not a valid hex colour')
    }

    const tagId = await createTag(name, colour, projectId)
    if (!tagId && tagId !== 0) {
        throw new Error('Failed to create tag')
    }

    return { message: 'Succesfully created new tag', tagId }
})

// already checks to user if user can access the task
export const createChecklistEndpoint = createEndpoint(async (req) => {
    const { taskId } = req.query
    const { name } = req.body

    if (!name) {
        throw new Error('No name provided')
    }

    const checklistId = await createChecklist(name, taskId)
    if (!checklistId && checklistId !== 0) {
        throw new Error('Failed to add checklist')
    }

    return { message: 'Successfully added new checklist', checklistId }
})

