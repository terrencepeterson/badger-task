import { convertColumnToFrontName, createEndpoint, dateIsInFuture, jsDateToSqlDate } from "./utility.mjs"
import { TASK_STATE_ACTIVE, TASK_STATE_COMPLETED, TASK_STATE_HOLD, TASK_TABLE } from "./definitions.mjs"
import { getIsValidAssignee } from "./attributeAccess.mjs"
import { generateUpdate, getMoveTaskDetails } from "../db/db.mjs"
import { moveTaskToNewColumn, moveTaskWithinColumn, moveTaskToEndOfNewColumn } from "../db/moveTask.mjs"

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

        allowedData = await validateAndFormatData(allowedData, updateId)
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

export const updateTaskEndpoint = createPutEndpoint(
    taskFormatAndValidation,
    ['name', 'description', 'dueDate', 'state', 'newProjectRow', 'assignee', 'newProjectColumnId'],
    TASK_TABLE,
    'taskId'
)

async function taskFormatAndValidation(allowedData, taskId) {
    allowedData = { ...allowedData } // clone data to keep function pure - shallow clone fine only changes primitive data
    const { name, description, dueDate, state, assignee, newProjectRow, newProjectColumnId } = allowedData
    const { currentProjectColumnId,
        currentProjectRow,
        maxRowCurrentColumn,
        maxRowNewColumn,
        validProjectColumnIds
    } = await getMoveTaskDetails(taskId, newProjectColumnId)

    const isValidRow = (row, highestRow) => {
        if (isNaN(row) || row.trim && row.trim() === '') {
            throw new Error('Please provide a valid number for the new project row')
        }
        if (row < 0 || row > highestRow) {
            throw new Error('Invalid row - please provide a value that is bigger than 0 and no bigger than the maximum current row')
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
        throw new Error('The task cannot be assigned to the project column becuase it is not part of the same project')
    }

    if (Object.hasOwn(allowedData, 'newProjectRow') && Object.hasOwn(allowedData, 'newProjectColumnId')) { // column & row change
        isValidRow(newProjectRow, maxRowNewColumn - 1)
        await moveTaskToNewColumn(taskId, currentProjectColumnId, currentProjectRow, newProjectColumnId, newProjectRow, maxRowCurrentColumn, maxRowNewColumn, TASK_TABLE)
    }
    else if (Object.hasOwn(allowedData, 'newProjectRow')) { // row change
        isValidRow(newProjectRow, maxRowCurrentColumn - 1)
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
        await moveTaskToEndOfNewColumn(maxRowNewColumn, newProjectColumnId, taskId, currentProjectColumnId, currentProjectRow, maxRowCurrentColumn, TASK_TABLE)
    }
    delete allowedData.newProjectRow
    delete allowedData.newProjectColumnId


    return allowedData
}

