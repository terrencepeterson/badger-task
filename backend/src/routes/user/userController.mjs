import { createEndpoint } from "../../utility.mjs"
import { getDashboardTasks } from "../task/taskService.mjs"
import { getUserDashboard } from "./userService.mjs"
import { getProjectsByUserId } from "../project/projectService.mjs"
import { getTagsByUserId } from "../project/projectService.mjs"

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

