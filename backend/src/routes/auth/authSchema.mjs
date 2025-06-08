import { z } from "zod/v4"
import { emailValidation, nameValidation, nullableStringValidation, passwordValidaton } from "../../validation.mjs"

const loginBodySchema = z.object({
    email: emailValidation,
    password: z.string()
})

const signupBodySchema = z.object({
    name: nameValidation,
    email: emailValidation,
    password: passwordValidaton,
    description: nullableStringValidation.default(null),
    confirmPassword: z.string()
})

export const loginSchema = { body: loginBodySchema }
export const signupSchema = { body: signupBodySchema }

