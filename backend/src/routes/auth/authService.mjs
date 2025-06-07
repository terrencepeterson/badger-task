import { defaultUserAvatarLink } from "../../cloudinary.mjs"
import { generateInsert, query } from "../../db.mjs"
import { USER_TABLE, COLUMN_AGENDA_TABLE, AVATAR_IMAGE_TYPE } from "../../definitions.mjs"
import { convertDbImgToUrl } from "../../utility.mjs"

export async function createUser(name, email, description, role, password) {
    const userId = await generateInsert(USER_TABLE, { name, email, description, role, password })
    await addDefaultAgenda(userId)
    let user = await query(`
        SELECT id, name, email, avatar_img_version, created_at
        FROM ${USER_TABLE} where id = ?;
    `, [userId])

    user = convertDbImgToUrl(user[0], AVATAR_IMAGE_TYPE, AVATAR_IMAGE_TYPE, defaultUserAvatarLink, USER_TABLE, user[0].id)
    return user
}

export async function getUserByEmail(email, includePassword = false) {
    const user = await query(`
        SELECT id, email, ${ includePassword ? 'password, ' : '' } role
        FROM ${USER_TABLE} where email = ?
    `, [email])

    return user.length ? user[0] : null
}

function addDefaultAgenda(userId) {
    return query(`
        INSERT INTO ${COLUMN_AGENDA_TABLE} (name, colour, \`column\`, user_id) VALUES
        ('Focus', '#FFAA00', 0, ?),
        ('Reply to', '#A179F2', 1, ?),
        ('Upcoming', '#2BD9D9', 2, ?),
        ('On hold', '#D01F2E', 3, ?);
    `, [userId, userId, userId, userId])
}

