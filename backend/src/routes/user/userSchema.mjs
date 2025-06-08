import { z } from "zod/v4"
import { createIdSchema } from "../../utility.mjs"
import { passwordValidaton } from "../../validation.mjs"

const dashboardQuerySchema = createIdSchema('batchNumber')
const userIdParamSchema = createIdSchema('userId')
const updatePasswordBodySchema = z.object({
    currentPassword: z.string(),
    newPassword: passwordValidaton,
    confirmPassword: z.string()
})

export const dashboardSchema = { query: dashboardQuerySchema }
export const userIdSchema = { params: userIdParamSchema }
export const updatePasswordSchema = { params: userIdParamSchema, body: updatePasswordBodySchema }

