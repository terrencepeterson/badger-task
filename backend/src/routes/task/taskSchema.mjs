import { z } from "zod/v4"
import { createIdSchema, dateIsInFuture, jsDateToSqlDate } from "../../utility.mjs"
import { idValidation, nameValidation, nullableIdValidation, nullableStringValidation } from "../../validation.mjs"
import { TASK_STATE_HOLD, TASK_STATE_ACTIVE, TASK_STATE_COMPLETED } from "../../definitions.mjs"

const taskIdParamSchema = createIdSchema('taskId')
const dueDateValidation = z.union([z.iso.datetime().refine((val) => dateIsInFuture(val), { error: 'Invalid date - date must be in the future' }).transform(val => jsDateToSqlDate(val)), z.null()])

const createTaskBodySchema = z.object({
    name: nameValidation,
    description: nullableStringValidation.default(null),
    assignee: nullableIdValidation.default(null),
    dueDate: dueDateValidation.default(null),
    projectColumnId: idValidation
})

const updateTaskBodySchema = z.object({
    name: nameValidation.optional(),
    description: nullableStringValidation.optional(),
    state: z.literal([TASK_STATE_COMPLETED, TASK_STATE_ACTIVE, TASK_STATE_HOLD]).optional(),
    dueDate: dueDateValidation.optional(),
    assignee: nullableIdValidation.optional(),
    newProjectRow: idValidation.optional(),
    newProjectColumnId: idValidation.optional(),
    newAgendaRow: idValidation.optional(),
    newAgendaColumnId: idValidation.optional()
})

const createChecklistBodySchema = z.object({
    name: nameValidation
})

const createCommentBodySchema = z.object({
    text: nameValidation
})

export const getTaskSchema = { params: taskIdParamSchema }
export const createTaskSchema = { body: createTaskBodySchema }
export const updateTaskSchema = { params: taskIdParamSchema, body: updateTaskBodySchema }
export const createChecklistSchema = { params: taskIdParamSchema, body: createChecklistBodySchema }
export const createCommnentSchema = { params: taskIdParamSchema, body: createCommentBodySchema }

