import { z } from "zod/v4"
import { createIdSchema } from "../../utility.mjs"
import { nameValidation, nullableStringValidation, passwordValidaton } from "../../validation.mjs"

const dashboardQuerySchema = createIdSchema('batchNumber')
const userIdParamSchema = createIdSchema('userId')
const updatePasswordBodySchema = z.object({
    currentPassword: z.string(),
    newPassword: passwordValidaton,
    confirmPassword: z.string()
})

const updateUserBodySchema = z.object({
    name: nameValidation.optional(),
    description: nullableStringValidation.optional(),
})

export const dashboardSchema = { query: dashboardQuerySchema }
export const userIdSchema = { params: userIdParamSchema }
export const updatePasswordSchema = { params: userIdParamSchema, body: updatePasswordBodySchema }
export const updateUserSchema = { params: userIdParamSchema, body: updateUserBodySchema }

