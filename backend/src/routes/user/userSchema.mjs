import { createIdSchema } from "../../utility.mjs"

const dashboardQuerySchema = createIdSchema('batchNumber')
const userIdParamSchema = createIdSchema('userId')

export const dashboardSchema = { query: dashboardQuerySchema }
export const userIdSchema = { params: userIdParamSchema }

