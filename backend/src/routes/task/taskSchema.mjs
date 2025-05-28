import { z } from "zod/v4"
import { createIdSchema, dateIsInFuture, jsDateToSqlDate } from "../../utility.mjs"
import { idValidation, nameValidation, nullableIdValidation, nullableStringValidation } from "../../validation.mjs"
import { TASK_STATE_HOLD, TASK_STATE_ACTIVE, TASK_STATE_COMPLETED, CHECKLIST_STATES, CHECKLIST_TABLE, COMMENT_TABLE } from "../../definitions.mjs"
import { doIdsMatch } from "../../db.mjs"

const taskIdParamSchema = createIdSchema('taskId')
const dueDateValidation = z.union([z.iso.datetime().refine((val) => dateIsInFuture(val), { error: 'Invalid date - date must be in the future' }).transform(val => jsDateToSqlDate(val)), z.null()])

const updateChecklistParamSchema = z.object({
    taskId: idValidation,
    checklistId: idValidation
}).check(async (ctx) => {
    const { taskId, checklistId } = ctx.value
    console.log(ctx.value)
    if (!await doIdsMatch(CHECKLIST_TABLE, checklistId, 'task_id', taskId)) {
        ctx.issues.push({
            code: 'custom',
            message: 'Invalid taskId or checklistId - make sure they\'re correct',
            input: ctx.value,
            path: ['taskId & checklistId']
        })
    }
})

const updateCommentParamSchema = z.object({
    taskId: idValidation,
    commentId: idValidation
}).check(async (ctx) => {
    const { taskId, commentId } = ctx.value
    if (!await doIdsMatch(COMMENT_TABLE, commentId, 'task_id', taskId)) {
        ctx.issues.push({
            code: 'custom',
            message: 'Invalid taskId or commentId - make sure they\'re correct',
            input: ctx.value,
            path: ['taskId & commentId']
        })
    }
})

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

const updateChecklistBodySchema = z.object({
    name: nameValidation.optional(),
    state: z.literal(CHECKLIST_STATES).optional()
})

const updateCommentBodySchema = z.object({
    text: nameValidation
})

export const getTaskSchema = { params: taskIdParamSchema }
export const createTaskSchema = { body: createTaskBodySchema }
export const updateTaskSchema = { params: taskIdParamSchema, body: updateTaskBodySchema }
export const createChecklistSchema = { params: taskIdParamSchema, body: createChecklistBodySchema }
export const createCommnentSchema = { params: taskIdParamSchema, body: createCommentBodySchema }
export const updateChecklistSchema = { params: updateChecklistParamSchema, body: updateChecklistBodySchema }
export const updateCommentSchema = { params: updateCommentParamSchema, body: updateCommentBodySchema }

