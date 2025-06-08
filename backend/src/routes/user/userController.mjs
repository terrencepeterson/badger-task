import { createEndpoint, createImageEndpoint } from "../../utility.mjs"
import { getDashboardTasks } from "../task/taskService.mjs"
import { getPasswordById, getUserDashboard } from "./userService.mjs"
import { getProjectsByUserId } from "../project/projectService.mjs"
import { getTagsByUserId } from "../project/projectService.mjs"
import { AVATAR_IMAGE_TYPE, BACKGROUND_IMAGE_TYPE, USER_TABLE } from "../../definitions.mjs"
import bcrypt from "bcryptjs"
import { generateUpdate } from "../../db.mjs"

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

export const updatePasswordEndpoint = createEndpoint(async (req) => {
    const { currentPassword, newPassword, confirmPassword } = req.body
    const { id: userId } = req.user
    if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match!')
    }

    const password = await getPasswordById(userId)
    if (!password) {
        throw new Error('Internal server error')
    }

    const matchedPassword = await bcrypt.compare(currentPassword, password)
    if (!matchedPassword) {
        throw new Error('Incorrect password')
    }

    if (currentPassword === newPassword) {
        throw new Error('Passwords match please provide a new password')
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    const hasUpdatedPassword = await generateUpdate(USER_TABLE, { password: hashedPassword }, 'id', userId)
    if (!hasUpdatedPassword) {
        throw new Error('Failed to update password')
    }

    return 'Successfully updated password'
})

export const updateUserAvatarEndpoint = createImageEndpoint(USER_TABLE, 'userId', AVATAR_IMAGE_TYPE)
export const updateUserBackgroundEndpoint = createImageEndpoint(USER_TABLE, 'userId', BACKGROUND_IMAGE_TYPE)

