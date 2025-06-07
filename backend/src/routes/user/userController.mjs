import { createEndpoint, createImageEndpoint } from "../../utility.mjs"
import { getDashboardTasks } from "../task/taskService.mjs"
import { getUserDashboard } from "./userService.mjs"
import { getProjectsByUserId } from "../project/projectService.mjs"
import { getTagsByUserId } from "../project/projectService.mjs"
import { AVATAR_IMAGE_TYPE, BACKGROUND_IMAGE_TYPE, USER_TABLE } from "../../definitions.mjs"

export const dashboardEndpoint = createEndpoint(async (req) => {
    const { batchNumber } =  req.query
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

export const updateUserAvatarEndpoint = createImageEndpoint(USER_TABLE, 'userId', AVATAR_IMAGE_TYPE)
export const updateUserBackgroundEndpoint = createImageEndpoint(USER_TABLE, 'userId', BACKGROUND_IMAGE_TYPE)

