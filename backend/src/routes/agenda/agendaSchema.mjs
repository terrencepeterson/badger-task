import { z } from "zod/v4"
import { createIdSchema } from "../../utility.mjs"
import { hexColourValidation, idValidation, nameValidation } from "../../validation.mjs"

const agendaColumnParamSchema = createIdSchema('agendaColumnId')
const agendaColumnQuerySchema = createIdSchema('row')

const createAgendaColumnBodySchema = z.object({
    name: nameValidation,
    colour: hexColourValidation
})

const updateAgendaColumnBodySchema = z.object({
    name: nameValidation.optional(),
    colour: hexColourValidation.optional(),
    column: idValidation.optional()
})

export const getAgendaColumnSchema = { params: agendaColumnParamSchema, query: agendaColumnQuerySchema }
export const createAgendaColumnSchema = { body: createAgendaColumnBodySchema }
export const updateAgendaColumnSchema = { params: agendaColumnParamSchema, body: updateAgendaColumnBodySchema }
export const deleteAgendaColumnSchema = { params: agendaColumnParamSchema }

