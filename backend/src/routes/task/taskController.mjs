import { createEndpoint, createPutEndpoint, createDeleteEndpoint, createDeleteWAccessControlEndpoint } from "../../utility.mjs"
import { TASK_TABLE, ACCESS_CONTROL_TASKS, COLUMN_PROJECT_TABLE, CHECKLIST_TABLE, COMMENT_TABLE, TASK_COLUMN_AGENDA_TABLE } from "../../definitions.mjs"
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
    createChecklist,
    getIsValidTasksProjectColumn,
    updateTasksProjectColumn,
} from "./taskService.mjs"

export const taskEndpoint = createEndpoint(async (req) => {
    const { taskId } = req.params

    const task = await getTaskById(taskId, req.user.id)
    if (!task) {
        throw new Error('Task not found with specified ID')
    }

    task.comments = await getCommentsByTaskId(taskId)
    task.tags = await getTagsByTaskId(taskId)
    task.checklist = await getChecklistByTaskId(taskId)

    return task
})

export const createTaskEndpoint = createEndpoint(async (req) => {
    let { name, description, assignee, dueDate, projectColumnId } = req.body
    const createdBy = req.user.id

    if ((assignee || assignee === 0) && !await getIsValidAssignee(assignee, projectColumnId.toString())) {
        throw new Error('Invalid Assignee - they\'re not authorised to access the project that this task is being created in')
    }

    // projects always get put to the bottom of the row
    const rows = await getProjectColumnRows(projectColumnId)
    const projectRow = rows.length ? ++rows[0] : 0

    const taskId = await createTask(name, description, dueDate, projectRow, createdBy, assignee, projectColumnId)
    if (!taskId && taskId !== 0) {
        throw new Error('Failed to create task')
    }

    const projectId = await getIdByDifferentId('project_id', COLUMN_PROJECT_TABLE, 'id', projectColumnId)
    const accesssUsers = await getUserProjectAccess(projectId)
    await addMultipleAttributeAccess(accesssUsers, ACCESS_CONTROL_TASKS, taskId.toString())

    return { message: 'Successfully created task', taskId }
})

export const updateTaskEndpoint = createPutEndpoint(
    updateTaskFormatValidation,
    TASK_TABLE,
    'taskId'
)

async function updateTaskFormatValidation(allowedData, taskId, userId) {
    allowedData = { ...allowedData } // clone data to keep function pure - shallow clone fine only changes primitive data
    const {
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

    if (Object.hasOwn(allowedData, 'dueDate')) {
        allowedData.due_date = allowedData.dueDate
        delete allowedData.dueDate
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

export const createChecklistEndpoint = createEndpoint(async (req) => {
    const { name, } = req.body
    const { taskId } = req.params

    const checklistId = await createChecklist(name, taskId)
    if (!checklistId && checklistId !== 0) {
        throw new Error('Failed to add checklist')
    }

    return { message: 'Successfully added new checklist', checklistId }
})

export const createCommentEndpoint = createEndpoint(async (req) => {
    const { id: createdBy } = req.user
    const { text, } = req.body
    const { taskId } = req.params

    const comment = await createComment(text, taskId, createdBy)
    if (!comment) {
        throw new Error('Failed to create comment')
    }

    return { message: 'Successfully created comment', comment }
})

export const updateChecklistEndpoint = createPutEndpoint(
    false,
    CHECKLIST_TABLE,
    'checklistId'
)

export const updateCommentEndpoint = createPutEndpoint(
    updateCommentFormat,
    COMMENT_TABLE,
    'commentId'
)

function updateCommentFormat(allowedData) {
    allowedData.edited = 1

    return allowedData
}

export const deleteCommentEndpoint = createDeleteEndpoint(COMMENT_TABLE, 'commentId')
export const deleteChecklistEndpoint = createDeleteEndpoint(CHECKLIST_TABLE, 'checklistId')
export const deleteTaskEndpoint = createDeleteWAccessControlEndpoint(TASK_TABLE, 'taskId', ACCESS_CONTROL_TASKS, 'task')

export const tasksUpdateProjectColumnEndpoint = createEndpoint(async (req) => {
    const { projectColumnId: newProjectColumnId } = req.params
    const { taskIds, currentProjectColumnId } = req.body
    const isValidTaskIds = await getIsValidTasksProjectColumn(taskIds, currentProjectColumnId)
    if (!isValidTaskIds) {
        throw new Error('Invalid project column - please provide all tasks from a single project column')
    }

    await updateTasksProjectColumn(currentProjectColumnId, newProjectColumnId, taskIds)

    return { message: 'Successfully moved tasks', taskIds }
})

