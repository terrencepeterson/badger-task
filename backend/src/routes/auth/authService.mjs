import { generateInsert, query } from "../../db.mjs"
import { USER_TABLE, COLUMN_AGENDA_TABLE, ACTIVE_USER_TABLE } from "../../definitions.mjs"

export async function getUserEmails() {

    const emails = await query(`
        SELECT email
        FROM ${ACTIVE_USER_TABLE};
    `)

    if (!emails || !emails.length) {
        return []
    }

    return emails.map(e => e.email)
}

export async function createUser(name, email, description, role, password, img_url) {
    const userId = await generateInsert(USER_TABLE, { name, email, description, role, password, img_url })
    await addDefaultAgenda(userId)
    const user = await query(`
        SELECT id, name, email, img_url, created_at
        FROM ${USER_TABLE} where id = ?;
    `, [userId])

    return user[0]
}

export async function getUserByEmail(email) {
    const user = await query(`
        SELECT id, email, password, role
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

