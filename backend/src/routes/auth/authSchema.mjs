import { z } from "zod/v4"
import { emailValidation, imgUrlValidation, nameValidation, nullableStringValidation } from "../../validation.mjs"
import { DEFAULT_DB_VALUE } from "../../definitions.mjs"
// minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/

const loginBodySchema = z.object({
    email: emailValidation,
    password: z.string()
})

const signupBodySchema = z.object({
    name: nameValidation,
    email: emailValidation,
    password: z.string().regex(passwordRegex, 'Invalid password - password must contain at at least 1 lowercase letter, 1 uppercase letter, 1 number and 1 symbol and be a minimum of 8 characters long'),
    description: nullableStringValidation.default(null),
    imgUrl: imgUrlValidation.default(DEFAULT_DB_VALUE),
    confirmPassword: z.string()
})

export const loginSchema = { body: loginBodySchema }
export const signupSchema = { body: signupBodySchema }

