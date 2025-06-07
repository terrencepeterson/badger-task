import { z } from "zod/v4"
import { nameValidation } from "../../validation.mjs"
import { createIdSchema } from "../../utility.mjs"

const organisationParamSchema = createIdSchema('organisationId')

const organisationBodySchema = z.object({
    name: nameValidation.optional()
})

export const updateOrganiationSchema = { params: organisationParamSchema, body: organisationBodySchema }
export const createOrganisationSchema = { body: organisationBodySchema }
export const organisationIdSchema = { params: organisationParamSchema }

