import { createEndpoint, dateIsInFuture, jsDateToSqlDate, formatNullableInput, createPutEndpoint } from "../../utility.mjs"
import { TASK_TABLE, ACCESS_CONTROL_TASKS, COLUMN_PROJECT_TABLE, TASK_STATE_HOLD, TASK_STATE_COMPLETED, TASK_STATE_ACTIVE } from "../../definitions.mjs"
import { getProjectColumnRows, getUserProjectAccess } from "../project/projectService.mjs"
import { getIsValidAssignee, addMultipleAttributeAccess } from "../../accessControl/attributeAccess.mjs"
import { getIdByDifferentId } from "../../db.mjs"
import { moveTaskToNewColumn, moveTaskToEndOfNewColumn, moveTaskWithinColumn, addTaskToAgendaColumn } from "./taskServiceMove.mjs"
import {
    getTaskById,
    getCommentsByTaskId,
    getTagsByTaskId,
    getChecklistByTaskId,
    createTask,
    getEditTaskHelperColumns,
    createComment,
    createChecklist
} from "./taskService.mjs"

export const taskEndpoint = createEndpoint(async (req) => {
    const { taskId } = req.params

    if (!taskId) {
        throw new Error('No task ID provided')
    }

    const task = await getTaskById(taskId, req.user.id)
    if (!task || !task.taskId) {
        throw new Error('Task not found with specified ID')
    }

    task.comments = await getCommentsByTaskId(taskId)
    task.tags = await getTagsByTaskId(taskId)
    task.checklist = await getChecklistByTaskId(taskId)

    return task
})

export const createTaskEndpoint = createEndpoint(async (req) => {
    let { name, description, projectRow, assignee, dueDate } = req.body
    const projectColumnId = req.query.column
    const createdBy = req.user.id
    description = formatNullableInput(description)
    assignee = formatNullableInput(assignee)

    if (!name) {
        throw new Error('Please provide a name')
    }

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

export const editTaskEndpoint = createPutEndpoint(
    editTaskFormatValidation,
    ['name', 'description', 'dueDate', 'state', 'newProjectRow', 'assignee', 'newProjectColumnId', 'newAgendaRow', 'newAgendaColumnId'],
    TASK_TABLE,
    'taskId'
)

async function editTaskFormatValidation(allowedData, taskId, userId) {
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

    console.log({assignee, currentProjectColumnId})
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
