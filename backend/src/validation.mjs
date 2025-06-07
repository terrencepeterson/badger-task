import { z } from "zod/v4"
import { IMAGE_TYPES } from "./definitions.mjs"

const imageTypes = IMAGE_TYPES.join('|')
const imageTypesRegex = new RegExp(`.(${imageTypes})$`)
const hexColourRegex = /^#[0-9a-fA-F]{6}$/

export const nameValidation = z.string().trim().min(1)
export const hexColourValidation = z.string().trim().regex(hexColourRegex, 'Invalid hex colour')
export const imgUrlValidation = z.string().trim().regex(imageTypesRegex, 'Invalid file type - please provide a .jpg, .jpeg, .png or .svg image')
export const nullableStringValidation = z.union([z.string().trim().min(1), z.null()], 'Invalid input type, please provide a string (that is at least one character long) or null')
export const emailValidation = z.string().min(1, "Please provide a value for email").email("Invalid email address")
export const idValidation = z.union([z
    .string()
    .trim()
    .min(1, { message: "ID cannot be empty" })
    .refine(val => /^\d+$/.test(val), { message: "ID must be a non-negative integer" })
    .transform(val => Number(val)),
    z.number().int().min(0)
])
export const nullableIdValidation = z.union([idValidation, z.null()])

export const imageFileSchema = {
    file: z.looseObject({
        mimetype: z.literal(['image/png', 'image/jpeg', 'image/webp'], 'Invalid file type')
    })
}

