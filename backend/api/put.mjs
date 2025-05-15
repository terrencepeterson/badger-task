import { convertColumnToFrontName, createEndpoint, dateIsInFuture, jsDateToSqlDate } from "./utility.mjs"
import { TASK_STATE_ACTIVE, TASK_STATE_COMPLETED, TASK_STATE_HOLD, TASK_TABLE } from "./definitions.mjs"
import { getIsValidAssignee } from "./attributeAccess.mjs"
import { generateUpdate, getIdByDifferentId, getProjectColumnsByProjectId, getProjectColumnRows } from "../db/db.mjs"
import { moveTaskToEndOfNewColumn, moveTaskWithinRow } from "../db/moveTask.mjs"

function createPutEndpoint(validateAndFormatData, allowedColumnKeys, helperColumnKeys, table, updateIdKey) {
    return createEndpoint(async (req) => {
        const helperColumnData = Object.fromEntries(helperColumnKeys.map(k => [k, req.body[k]]))
        let allowedData = Object.fromEntries(
            Object.entries(req.body).
            filter(([columnName, val]) => allowedColumnKeys.includes(columnName))
        )
        const allowedDataKeys = Object.keys(allowedData)
        const updateId = req.query[updateIdKey]
        const successMessage = `Updated ${table}: ${allowedDataKeys.map(c => convertColumnToFrontName(c)).join(', ')}`

        for (const colKey of helperColumnKeys) {
            if (!Object.hasOwn(req.body, colKey) || !helperColumnData[colKey] && helperColumnData[colKey] !== 0) {
                throw new Error(`Must provide a value for ${colKey}`)
            }
        }

        if (!allowedDataKeys.length) {
            throw new Error('No data provided')
        }

        allowedData = await validateAndFormatData(allowedData, helperColumnData, updateId)
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
    ['name', 'description', 'dueDate', 'state', 'projectRow', 'assignee', 'projectColumnId'],
    ['currentRow', 'currentProjectColumnId', 'projectId'],
    TASK_TABLE,
    'taskId'
)

async function taskFormatAndValidation(allowedData, helperColumnData, taskId) {
    allowedData = { ...allowedData } // clone data to keep function pure - shallow clone fine only changes primitive data
    const { name, description, dueDate, state, assignee, projectRow, projectColumnId } = allowedData

    if (Object.hasOwn(allowedData, 'name') && !name && name != 0) {
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

    if (Object.hasOwn(allowedData, 'assignee') && !await getIsValidAssignee(assignee, helperColumnData.currentProjectColumnId)) {
        throw new Error('Invalid Assignee - they\'re not authorised to access the project for this task')
    }

    if (Object.hasOwn(allowedData, 'projectRow') && Object.hasOwn(allowedData, 'projectColumnId')) {
        // column & row change
        // is it different from the last one
    } else if (Object.hasOwn(allowedData, 'projectRow')) {
        // row change
        await moveTask(+taskId, +projectRow, +projectColumnId, +helperColumnData.currentRow, +helperColumnData.currentProjectColumnId)
    } else if (Object.hasOwn(allowedData, 'projectColumnId')) {
        // column change
        const projectColumns = await getProjectColumnsByProjectId(helperColumnData.projectId) ?? []
        const projectColumnIds = projectColumns.map(c => c.id)
        if (!projectColumnIds.includes(+projectColumnId)) {
            throw new Error('The task cannot be assigned to the project column becuase it is not part of the same project')
        }

        const rows = await getProjectColumnRows(projectColumnId)
        const newRow = rows.length ? ++rows[0] : 0
        await moveTaskToEndOfNewColumn(+newRow, +projectColumnId, taskId, +helperColumnData.currentProjectColumnId, +helperColumnData.currentRow)
    }
    delete allowedData.projectRow
    delete allowedData.projectColumnId

    return allowedData
}

async function moveTask(taskId, newRow, column, currentRow, currentColumn) {
    if (column === currentColumn && newRow === currentRow) {
        return
    }

    let sqlBiggerThan, sqlLessThan, symbol

    if (newRow > currentRow) {
        // going from (currentRow =) 1 to (newRow =) 3 then we need to change rows
        // that are bigger than the currentRow (1) and less than the new newRow (newRow) + 1 (4)
        // so rows 2 and 3 will get decremented
        sqlBiggerThan = currentRow
        sqlLessThan = newRow + 1
        symbol = '-'
    } else {
        // going from (currentRow =) 5 to (newRow =) 3 then we need to change rows
        // that are bigger than the new newRow (newRow) minus 1 (2) less than the current newRow (5)
        // so rows 3 and 4 will get incremented
        sqlBiggerThan = newRow - 1
        sqlLessThan = currentRow
        symbol = '+'
    }

    const hasMoved = await moveTaskWithinRow(taskId, symbol, sqlBiggerThan, sqlLessThan, newRow, currentColumn)
}

