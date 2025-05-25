import { z } from "zod/v4"
import { createIdSchema } from "../../utility.mjs"
import { hexColourValidation, nameValidation } from "../../validation.mjs"

const agendaColumnParamSchema = createIdSchema('agendaColumnId')
const agendaColumnQuerySchema = createIdSchema('row')

const createAgendaColumnBodySchema = z.object({
    name: nameValidation,
    colour: hexColourValidation
})

export const getAgendaColumnSchema = { params: agendaColumnParamSchema, query: agendaColumnQuerySchema }
export const createAgendaColumnSchema = { body: createAgendaColumnBodySchema }

