import { z } from "zod/v4"
import { createIdSchema } from "../../utility.mjs"

const dashboardQuerySchema = createIdSchema('batchNumber')

export const dashboardSchema = { query: dashboardQuerySchema }

