import {
    getDashboardTasks,
    getUserDashboard,
    getProjectsByUserId,
    getTagsByUserId,
    getTaskById,
    getCommentsByTaskId,
    getTagsByTaskId,
    getChecklistByTaskId
} from "./db.mjs"

export async function dashboard(userId, lastTaskId = 0) {
    let dashboardData = {}
    let tasks = await getDashboardTasks(userId, lastTaskId)
    tasks = tasks.map(t => ({ ...t, tags: t.tags.split(',') }))
    dashboardData.tasks = tasks

    if (!userId) {
        throw new Error('Not authenticated, please login')
    }

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

export async function task(taskId) {
    if (!taskId) {
        throw new Error('No task ID provided')
    }

    const task = await getTaskById(taskId)
    if (!task || !task.taskId) {
        throw new Error('Task not found with specified ID')
    }

    task.comments = await getCommentsByTaskId(taskId)
    task.tags = await getTagsByTaskId(taskId)
    task.checklist = await getChecklistByTaskId(taskId)

    return task
}

