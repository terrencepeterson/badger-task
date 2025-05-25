import { z } from "zod/v4"
import { nameValidation, imgUrlValidation } from "../../validation.mjs"
import { DEFAULT_DB_VALUE } from "../../definitions.mjs"
import { createIdSchema } from "../../utility.mjs"

const organisationParamSchema = createIdSchema('organisationId')

const updateOrganisationBodySchema = z.object({
    name: nameValidation.optional(),
    imgUrl: imgUrlValidation.optional()
})

const createOrganisationBodySchema = z.object({
    name: nameValidation,
    imgUrl: imgUrlValidation.default(DEFAULT_DB_VALUE)
})

export const updateOrganiationSchema = { params: organisationParamSchema, body: updateOrganisationBodySchema }
export const createOrganisationSchema = { body: createOrganisationBodySchema }

