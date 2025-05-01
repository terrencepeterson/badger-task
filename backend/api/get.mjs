import {
    getDashboardTasks,
    getUserDashboard,
    getProjectsByUserId,
    getTagsByUserId,
    getTaskById,
    getCommentsByTaskId,
    getTagsByTaskId,
    getChecklistByTaskId,
    getProjectTasks,
    getProjectColumnsByProjectId,
    getProjectUsersByProjectId,
    getProjectByProjectId,
    getAgendaTasks,
    getAgendaColumns,
    getAgendaUsers,
    getAgendaTags,
    getAgendaProjects,
    getProjectTags,
    getAgendaColumn,
    getProjectColumn
} from "../db.mjs"
import { createEndpoint } from "./utility.mjs"

export const dashboardEndpoint = createEndpoint(async (req) => {
    const batchNumber =  +req.query.batchNumber
    const { id: userId } = req.user

    let dashboardData = {}
    dashboardData.tasks = await getDashboardTasks(userId, batchNumber)

    if (batchNumber) { // if it's not the first request to this endpoint
        return dashboardData
    }

    Object.assign(dashboardData, await getUserDashboard(userId))

    if (!dashboardData.userId) {
        throw Error('No user exists with that id')
    }

    dashboardData.tags = await getTagsByUserId(userId)
    dashboardData.projects = await getProjectsByUserId(userId)

    return dashboardData
})

export const taskEndpoint = createEndpoint(async (req) => {
    const { taskId } = req.query

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

export const projectEndpoint = createEndpoint(async (req) => {
    const { projectId } = req.query

    if (!projectId) {
        throw new Error('No project id provided')
    }
    const projectDetails = await getProjectByProjectId(projectId)

    if (!projectDetails) {
        throw new Error('Project does not exist with that id')
    }

    projectDetails.tasks = await getProjectTasks(projectId, req.user.id)
    projectDetails.columns = await getProjectColumnsByProjectId(projectId)
    projectDetails.users = await getProjectUsersByProjectId(projectId)
    projectDetails.tags = await getProjectTags(projectId)

    return projectDetails
})

export const projectColumnEndpoint = createEndpoint((req) => {
    const { column, row } = req.query
    columnRowTest(column, row)

    return getProjectColumn(column, row, req.user.id)
})

export const agendaEndpoint = createEndpoint(async (req) => {
    const { id: userId } = req.user

    const agenda = {}

    agenda.tasks = await getAgendaTasks(userId)
    agenda.columns = await getAgendaColumns(userId)
    agenda.users = await getAgendaUsers(userId)
    agenda.tags = await getAgendaTags(userId)
    agenda.projects = await getAgendaProjects(userId)

    return agenda
})

export const agendaColumnEndpoint = createEndpoint((req) => {
    const { column, row } = req.query
    columnRowTest(column, row)

    return getAgendaColumn(column, row)
})

function columnRowTest(column, row) {
    if (column === null || column === undefined || column === '') {
        throw new Error('No column provide')
    }

    if (row === null || row === undefined || row === '') {
        throw new Error('No row provided')
    }
}

