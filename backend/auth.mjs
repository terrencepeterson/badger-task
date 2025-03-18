import bcrypt from "bcryptjs"
import isEmail from 'validator/lib/isEmail.js'
import isStrongPassword from 'validator/lib/isStrongPassword.js'
import { getUserEmails, addUser } from "./db.mjs"

export async function signup(body) {
    const { name, email, password, confirm_password } = body // required fields
    const description = body.description ? body.description.trim() : 'NULL'
    const img_url = body.img_url ?? 'DEFAULT'
    const role = 'DEFAULT'

    if (!name.trim() || !email.trim() || !password || !confirm_password) {
        throw new Error('Missing field, please enter values for all required fields')
    }

    if (password !== confirm_password) {
        throw new Error('Passsword and confirm password do not match')
    }

    if (!isStrongPassword(password)) {
        throw new Error('Please enter a password that is at least 8 characters long and contains at least 1 uppercase letter, 1 symbol and 1 number')
    }

    if (!isEmail(email)) {
        throw new Error('Please enter a valid email')
    }

    const userEmails = await getUserEmails()
    if (userEmails.includes(email)) {
        throw new Error('A user already exists with the provided email, please use a different email address')
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = await addUser({
        name: name.trim(),
        email,
        description,
        role,
        password: hash,
        img_url
    })

    return user
}

