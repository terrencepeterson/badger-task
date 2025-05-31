import { z } from "zod/v4"
import { DEFAULT_DB_VALUE, TAG_TABLE, VALID_PROJECT_COLUMN_ICONS } from "../../definitions.mjs"
import { createIdSchema, createValidateParamIds } from "../../utility.mjs"
import { hexColourValidation, nameValidation, imgUrlValidation, nullableStringValidation, idValidation } from "../../validation.mjs"

const projectParamSchema = createIdSchema('projectId')
const projectColumnParamSchema = createIdSchema(['projectId', 'projectColumnId'])
const validateTagParamIds = createValidateParamIds(TAG_TABLE, 'tagId', 'project_id', 'projectId')
const tagParamSchema = createIdSchema(['projectId', 'tagId']).check(validateTagParamIds)

const projectColumnIconsValidation = z.literal(VALID_PROJECT_COLUMN_ICONS)

const createProjectBodySchema = z.object({
    name: nameValidation,
    description: nullableStringValidation.default(null),
    imgUrl: imgUrlValidation.default(DEFAULT_DB_VALUE),
    isPrivate: z.boolean().default(false)
})

const updateProjectBodySchema = z.object({
    name: nameValidation.optional(),
    description: nullableStringValidation.optional(),
    imgUrl: imgUrlValidation.optional(),
    isPrivate: z.boolean().optional()
})

const createProjectColumnBodySchema = z.object({
    name: nameValidation,
    icon: projectColumnIconsValidation.default(DEFAULT_DB_VALUE),
    colour: hexColourValidation
})

const createTagBodySchema = z.object({
    name: nameValidation,
    colour: hexColourValidation
})

const updateProjectColumnBodySchema = z.object({
    name: nameValidation.optional(),
    icon: projectColumnIconsValidation.optional(),
    colour: hexColourValidation.optional(),
    column: idValidation.optional()
})

const editTagBodySchema = z.object({
    name: nameValidation.optional(),
    colour: hexColourValidation.optional()
})

export const createProjectSchema = { body: createProjectBodySchema }
export const updateProjectSchema = { params: projectParamSchema, body: updateProjectBodySchema }
export const getProjectSchema = { params: projectParamSchema}
export const getProjectColumnSchema = { params: projectColumnParamSchema }
export const createProjectColumnSchema = { params: projectParamSchema, body: createProjectColumnBodySchema }
export const createTagSchema = { params: projectParamSchema, body: createTagBodySchema }
export const updateProjectColumnSchema = { params: projectColumnParamSchema, body: updateProjectColumnBodySchema }
export const updateTagSchema = { params: tagParamSchema, body: editTagBodySchema }

