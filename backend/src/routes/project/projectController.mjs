import { createDeleteEndpoint, createEndpoint, createPutEndpoint } from "../../utility.mjs"
import {
    getProjectTasks,
    getProjectColumnsByProjectId,
    getProjectUsersWAssigneedTask,
    getProjectTags,
    getProjectByProjectId,
    disableProjectPrivateStatus,
    enableProjectPrivateStatus,
    getEditProjectHelperColumns,
    getProjectColumnColumns,
    createProjectColumn,
    getUserProjectAccess,
    getProjectColumn,
    createTag,
    createProject,
    updateUserProjectTable,
    getMoveProjectColumnHelperData
} from "./projectService.mjs"
import { getOrganisationIdByUserId, getAllUsersFromOrganisation } from "../organisation/organisationService.mjs"
import { ROLE_ADMIN, ACCESS_CONTROL_PROJECTS, PROJECT_TABLE, VALID_PROJECT_COLUMN_ICONS, ACCESS_CONTROL_COLUMN_PROJECTS, COLUMN_PROJECT_TABLE, TAG_TABLE } from "../../definitions.mjs"
import { addMultipleAttributeAccess, removeMultipleAttributeAccess } from "../../accessControl/attributeAccess.mjs"
import { moveColumn } from "../../db.mjs"

export const updateProjectEndpoint = createPutEndpoint(
    projectFormatAndValidation,
    ['name', 'description', 'imgUrl', 'isPrivate'],
    PROJECT_TABLE,
    'projectId'
)

export const getProjectEndpoint = createEndpoint(async (req) => {
    const projectId = req.params.projectId

    if (!projectId) {
        throw new Error('No project id provided')
    }
    const projectDetails = await getProjectByProjectId(projectId)

    if (!projectDetails) {
        throw new Error('Project does not exist with that id')
    }

    projectDetails.tasks = await getProjectTasks(projectId, req.user.id)
    projectDetails.columns = await getProjectColumnsByProjectId(projectId)
    projectDetails.users = await getProjectUsersWAssigneedTask(projectId)
    projectDetails.tags = await getProjectTags(projectId)

    return projectDetails
})

export const createProjectEndpoint = createEndpoint(async (req) => {
    const { id: userId, role: userRole } = req.user
    let { name, description, imgUrl, isPrivate } = req.body
    let accessControlUserIdsToUpdate
    const organisationId = await getOrganisationIdByUserId(userId)

    if (isPrivate && userRole !== ROLE_ADMIN) { // non admin users cannot create private projects
        throw new Error('Unauthorised - only admin users can create private projects')
    }

    if (!organisationId && organisationId !== 0) {
        throw new Error('You don\'t belong to an organisation')
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

async function projectFormatAndValidation(allowedData, projectId, userId) {
    allowedData = { ...allowedData }
    let { isPrivate } = allowedData
    const { currentPrivateStatus, organisationId } = await getEditProjectHelperColumns(projectId)

    if (Object.hasOwn(allowedData, 'isPrivate') && isPrivate !== currentPrivateStatus) {
        const allUsersFromOrganisation = await getAllUsersFromOrganisation(organisationId)
        if (!isPrivate) {
            await disableProjectPrivateStatus(projectId)
            await addMultipleAttributeAccess(allUsersFromOrganisation, ACCESS_CONTROL_PROJECTS, projectId)
        } else {
            const userIdsToKeepAccess = await enableProjectPrivateStatus(projectId, organisationId)
            const userIdsToRemoveAccess = allUsersFromOrganisation.filter(uId => !userIdsToKeepAccess.includes(uId))
            await removeMultipleAttributeAccess(userIdsToRemoveAccess, ACCESS_CONTROL_PROJECTS, projectId)
        }
    }

    delete allowedData.isPrivate
    return allowedData
}

export const getProjectColumnEndpoint = createEndpoint((req) => {
    const { projectColumnId: column } = req.params
    const { row } = req.query

    if (!column && column !== 0) {
        throw new Error('No column provide')
    }

    if (!row && row !== 0) {
        throw new Error('No row provided')
    }

    return getProjectColumn(column, row, req.user.id)
})

export const createProjectColumnEndpoint = createEndpoint(async (req) => {
    let { name, icon, colour } = req.body
    const { projectId } = req.params

    const currentColumns = await getProjectColumnColumns(projectId)
    const column = currentColumns ? ++currentColumns[0] : 0 // currentColumns always returns with highest column first

    const projectColumnId = await createProjectColumn(name, icon, colour, column, projectId)
    if (!projectColumnId && projectColumnId !== 0) {
        throw new Error('Failed to create project column')
    }

    const accesssUsers = await getUserProjectAccess(projectId)
    await addMultipleAttributeAccess(accesssUsers, ACCESS_CONTROL_COLUMN_PROJECTS, projectColumnId.toString())

    return { message: 'Successfully created project column', projectColumnId }
})

export const createTagEndpoint = createEndpoint(async (req) => {
    const { name, colour } = req.body
    const { projectId } = req.params

    const tagId = await createTag(name, colour, projectId)
    if (!tagId && tagId !== 0) {
        throw new Error('Failed to create tag')
    }

    return { message: 'Succesfully created new tag', tagId }
})

export const updateProjectColumnEndpoint = createPutEndpoint(
    updateProjectColumnFormat,
    ['name', 'icon', 'colour', 'column'],
    COLUMN_PROJECT_TABLE,
    'projectColumnId'
)

async function updateProjectColumnFormat(allowedData, projectColumnId, userId, req) {
    const { column: newColumn } = allowedData
    const { projectId } = req.params

    if (Object.hasOwn(allowedData, 'column')) {
        const { currentColumn, maxColumn } = await getMoveProjectColumnHelperData(req.params.projectId, projectColumnId)
        if (currentColumn === newColumn) {
            throw new Error('New column matches the current column please provide a new column')
        }

        if (newColumn > maxColumn) {
            throw new Error(`New column is out of range (0 - ${maxColumn}) - please provide a column within the given range`)
        }

        if (newColumn < currentColumn) {
            await moveColumn(projectColumnId, newColumn, newColumn - 1, currentColumn, '+', projectId, COLUMN_PROJECT_TABLE)
        } else {
            await moveColumn(projectColumnId, newColumn, currentColumn, newColumn + 1, '-', projectId, COLUMN_PROJECT_TABLE)
        }

        delete allowedData.column
    }
    allowedData = {}
    return allowedData
}

export const updateTagEndpoint = createPutEndpoint(
    false,
    ['name', 'colour'],
    TAG_TABLE,
    'tagId'
)

export const deleteTagEndpoint = createDeleteEndpoint(TAG_TABLE, 'tagId')

