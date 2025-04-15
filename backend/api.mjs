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
    getAgendaColumn
} from "./db.mjs"

export async function dashboard(userId, lastTaskId = 0) {
    if (!userId) {
        throw new Error('Not authenticated, please login')
    }

    let dashboardData = {}
    dashboardData.tasks = await getDashboardTasks(userId, lastTaskId)

    if (lastTaskId) { // if it's not the first request to this endpoint
        return dashboardData
    }

    Object.assign(dashboardData, await getUserDashboard(userId))

    if (!dashboardData.userId) {
        throw Error('No user exists with that id')
    }

    dashboardData.tags = await getTagsByUserId(userId)
    dashboardData.projects = await getProjectsByUserId(userId)

    return dashboardData
}

export async function task(taskId, userId) {
    if (!taskId) {
        throw new Error('No task ID provided')
    }

    const task = await getTaskById(taskId, userId)
    if (!task || !task.taskId) {
        throw new Error('Task not found with specified ID')
    }

    task.comments = await getCommentsByTaskId(taskId)
    task.tags = await getTagsByTaskId(taskId)
    task.checklist = await getChecklistByTaskId(taskId)

    return task
}

export async function project(projectId, userId) {
    if (!projectId) {
        throw new Error('No project id provided')
    }
    const projectDetails = await getProjectByProjectId(projectId)

    if (!projectDetails) {
        throw new Error('Project does not exist with that id')
    }

    projectDetails.tasks = await getProjectTasks(projectId, userId)
    projectDetails.columns = await getProjectColumnsByProjectId(projectId)
    projectDetails.users = await getProjectUsersByProjectId(projectId)
    projectDetails.tags = await getProjectTags(projectId)

    return projectDetails
}

export async function agenda(userId) {
    if (!userId) {
        throw new Error('Not authenticated, please login')
    }
    const agenda = {}

    agenda.tasks = await getAgendaTasks(userId)
    agenda.columns = await getAgendaColumns(userId)
    agenda.users = await getAgendaUsers(userId)
    agenda.tags = await getAgendaTags(userId)
    agenda.projects = await getAgendaProjects(userId)

    return agenda
}

export async function agendaColumn(column, row) {
    if (column === null || column === undefined) {
        throw new Error('No column provide for agenda')
    }

    if (row === null || row === undefined) {
        throw new Error('No row provided for agenda')
    }

    return await getAgendaColumn(column, row)
}

