import { convertColumnToFrontName, createEndpoint, dateIsInFuture, jsDateToSqlDate } from "./utility.mjs"
import { TASK_STATE_ACTIVE, TASK_STATE_COMPLETED, TASK_STATE_HOLD, TASK_TABLE, TASK_COLUMN_AGENDA_TABLE, ORGANISATION_TABLE, PROJECT_TABLE, ACCESS_CONTROL_PROJECTS } from "./definitions.mjs"
import { getIsValidAssignee, addMultipleAttributeAccess, removeMultipleAttributeAccess } from "./attributeAccess.mjs"
import {
    generateUpdate,
    getEditTaskHelperColumns,
    getEditProjectHelperColumns,
    getAllUsersFromOrganisation,
    disableProjectPrivateStatus,
    enableProjectPrivateStatus
} from "../db/db.mjs"
import { moveTaskToNewColumn, moveTaskWithinColumn, moveTaskToEndOfNewColumn, addTaskToAgendaColumn } from "../db/moveTask.mjs"

export const updateTaskEndpoint = createPutEndpoint(
    taskFormatAndValidation,
    ['name', 'description', 'dueDate', 'state', 'newProjectRow', 'assignee', 'newProjectColumnId', 'newAgendaRow', 'newAgendaColumnId'],
    TASK_TABLE,
    'taskId'
)

export const updateOrganisationEndpoint = createPutEndpoint(
    organisationFormatAndValidation,
    ['name'],
    ORGANISATION_TABLE,
    'organisationId'
)

export const updateProjectEndpoint = createPutEndpoint(
    projectFormatAndValidation,
    ['name', 'description', 'isPrivate'],
    PROJECT_TABLE,
    'projectId'
)

async function projectFormatAndValidation(allowedData, projectId, userId) {
    allowedData = { ...allowedData }
    let { name, description, isPrivate } = allowedData
    const { currentPrivateStatus, organisationId } = await getEditProjectHelperColumns(projectId)
    isPrivate = !!isPrivate

    if (Object.hasOwn(allowedData, 'name') && !name && name !== 0) {
        throw new Error('Name cannont be empty - please provide a valid value')
    }

    console.log(allowedData)
    if (Object.hasOwn(allowedData, 'description') && !description && description !== 0) {
        allowedData.description = null
    }

    if (typeof isPrivate !== 'boolean') {
        throw new Error('Incorrect value for isPrivate')
    }

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

async function taskFormatAndValidation(allowedData, taskId, userId) {
    allowedData = { ...allowedData } // clone data to keep function pure - shallow clone fine only changes primitive data
    const {
        name,
        description,
        dueDate,
        state,
        assignee,
        newProjectRow,
        newProjectColumnId,
        newAgendaRow,
        newAgendaColumnId
    } = allowedData

    const {
        currentProjectColumnId,
        currentProjectRow,
        currentAgendaColumnId,
        currentAgendaRow,
        maxRowCurrentProjectColumn,
        maxRowNewProjectColumn,
        validProjectColumnIds,
        validAgendaColumnIds,
        maxRowCurrentAgendaColumn,
        maxRowNewAgendaColumn
    } = await getEditTaskHelperColumns({ taskId, userId, newProjectColumnId, newAgendaColumnId })

    const isValidRow = (row, highestRow) => {
        if (isNaN(row) || row.trim && row.trim() === '') {
            throw new Error('Please provide a valid number for the new project row')
        }
        if (row < 0 || row > highestRow) {
            throw new Error(`Invalid row - please provide a value that is bigger than 0 and no bigger than ${highestRow}`)
        }
    }

    if (Object.hasOwn(allowedData, 'name') && !name && name !== 0) {
        throw new Error('Name is a required value and cannot be empty')
    }

    if (Object.hasOwn(allowedData, 'description') && !description && description !== 0) {
        allowedData.description = null
    }

    if (Object.hasOwn(allowedData, 'dueDate')) {
        if (!dueDate) {
            allowedData.due_date = null
        } else if (dueDate && !dateIsInFuture(dueDate)) {
            throw new Error('Invalid due date - please provide a date that is in the future')
        } else {
            allowedData.due_date = jsDateToSqlDate(dueDate)
        }
        delete allowedData.dueDate
    }

    if (Object.hasOwn(allowedData, 'state') &&
        state !== TASK_STATE_ACTIVE &&
        state !== TASK_STATE_COMPLETED &&
        state !== TASK_STATE_HOLD
    ) {
        throw new Error('Invalid state provided')
    }

    if (Object.hasOwn(allowedData, 'assignee') && !await getIsValidAssignee(assignee, currentProjectColumnId)) {
        throw new Error('Invalid Assignee - they\'re not authorised to access the project for this task')
    }

    if (newProjectColumnId === currentProjectColumnId) { // moving in the same column
        delete allowedData.newProjectColumnId
    }

    if (Object.hasOwn(allowedData, 'newProjectColumnId') && !validProjectColumnIds.includes(newProjectColumnId)) {
        throw new Error('Please provide a valid project column')
    }

    if (Object.hasOwn(allowedData, 'newProjectRow') && Object.hasOwn(allowedData, 'newProjectColumnId')) { // column & row change
        isValidRow(newProjectRow, maxRowNewProjectColumn - 1)
        await moveTaskToNewColumn(taskId, currentProjectColumnId, currentProjectRow, newProjectColumnId, newProjectRow, maxRowCurrentProjectColumn, maxRowNewProjectColumn, TASK_TABLE)
    }
    else if (Object.hasOwn(allowedData, 'newProjectRow')) { // row change
        isValidRow(newProjectRow, maxRowCurrentProjectColumn - 1)
        if (newProjectRow === currentProjectRow) {
            throw new Error('Provide a new row value - this value matches the current row')
        }

        if (newProjectRow > currentProjectRow) {
            await moveTaskWithinColumn(taskId, '-', currentProjectRow, newProjectRow + 1, newProjectRow, currentProjectColumnId, TASK_TABLE)
        } else {
            await moveTaskWithinColumn(taskId, '+', newProjectRow - 1, currentProjectRow, newProjectRow, currentProjectColumnId, TASK_TABLE)
        }
    }
    else if (Object.hasOwn(allowedData, 'newProjectColumnId')) { // column change
        await moveTaskToEndOfNewColumn(maxRowNewProjectColumn, newProjectColumnId, taskId, currentProjectColumnId, currentProjectRow, maxRowCurrentProjectColumn, TASK_TABLE)
    }

    if (Object.hasOwn(allowedData, 'newAgendaColumnId') && !validAgendaColumnIds.includes(newAgendaColumnId)) {
        throw new Error('Please provide a valid agenda column')
    }

    if (Object.hasOwn(allowedData, 'newAgendaRow') && Object.hasOwn(allowedData, 'newAgendaColumnId')) {
        isValidRow(newAgendaRow, maxRowNewAgendaColumn)
        if (!currentAgendaRow && currentAgendaRow !== 0) {
            await addTaskToAgendaColumn(taskId, newAgendaColumnId, newAgendaRow, maxRowNewAgendaColumn, TASK_COLUMN_AGENDA_TABLE)
        } else {
            await moveTaskToNewColumn(taskId, currentAgendaColumnId, currentAgendaRow, newAgendaColumnId, newAgendaRow, maxRowCurrentAgendaColumn, maxRowNewAgendaColumn, TASK_COLUMN_AGENDA_TABLE)
        }
    }
    else if (Object.hasOwn(allowedData, 'newAgendaRow')) {
        if (!currentAgendaRow && currentAgendaRow !== 0) {
            throw new Error('Task isn\'t assigned to an agenda column - please provide an agenda column')
        }
        if (newAgendaRow === currentAgendaRow) {
            throw new Error('The new agenda row matches the current agenda row - please provide a new value')
        }
        isValidRow(newAgendaRow, maxRowCurrentAgendaColumn - 1)

        if (newAgendaRow > currentAgendaRow) {
            await moveTaskWithinColumn(taskId, '-', currentAgendaRow, newAgendaRow + 1, newAgendaRow, currentAgendaColumnId, TASK_COLUMN_AGENDA_TABLE)
        } else {
            await moveTaskWithinColumn(taskId, '+', newAgendaRow - 1, currentAgendaRow, newAgendaRow, currentAgendaColumnId, TASK_COLUMN_AGENDA_TABLE)
        }
    }
    else if (Object.hasOwn(allowedData, 'newAgendaColumnId')) {
        if (!currentAgendaRow && currentAgendaRow !== 0) {
            await addTaskToAgendaColumn(taskId, newAgendaColumnId, maxRowNewAgendaColumn, maxRowNewAgendaColumn, TASK_COLUMN_AGENDA_TABLE)
        } else {
            await moveTaskToEndOfNewColumn(maxRowNewAgendaColumn, newAgendaColumnId, taskId, currentAgendaColumnId, currentAgendaRow, maxRowCurrentAgendaColumn, TASK_COLUMN_AGENDA_TABLE)
        }
    }

    delete allowedData.newProjectRow
    delete allowedData.newProjectColumnId
    delete allowedData.newAgendaRow
    delete allowedData.newAgendaColumnId

    return allowedData
}

function organisationFormatAndValidation(allowedData, organsiationId, userId) {
    if (Object.hasOwn(allowedData, 'name') && !allowedData.name && allowedData.name !== 0) {
        throw new Error('Invalid organisation name - please provide a value')
    }

    return allowedData
}

function createPutEndpoint(validateAndFormatData, allowedColumnKeys, table, updateIdKey) {
    return createEndpoint(async (req) => {
        let allowedData = Object.fromEntries(
            Object.entries(req.body).
            filter(([columnName, val]) => allowedColumnKeys.includes(columnName))
        )
        const allowedDataKeys = Object.keys(allowedData)
        const updateId = req.query[updateIdKey]
        const successMessage = `Updated ${table}: ${allowedDataKeys.map(c => convertColumnToFrontName(c)).join(', ')}`

        if (!allowedDataKeys.length) {
            throw new Error('No data provided')
        }

        allowedData = await validateAndFormatData(allowedData, updateId, req.user.id)
        if (!Object.keys(allowedData).length) {
            // sometimes we perform the changes in the validateAndFormat - say for the custom move rows stuff
            return successMessage
        }

        const data = await generateUpdate(table, allowedData, 'id', updateId)
        if (!data) {
            throw new Error(`Failed to update ${convertColumnToFrontName(table)}`)
        }

        return successMessage
    })
}

