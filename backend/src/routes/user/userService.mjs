import { query } from "../../db.mjs"
import { USER_TABLE, ORGANISATION_TABLE } from "../../definitions.mjs"

export async function getUserDashboard(id) {
    const user = await query(`
        SELECT
            COUNT(DISTINCT t.id) AS tasksTotalCount,
            u.id as userId,
            u.name as userName,
            u.img_url as userImgUrl,
            u.background_img_url as userBackgroundUrl,
            u.description as userDescription,
            o.name as organisationName,
            o.img_url as organisationImgUrl
        FROM ${USER_TABLE} u
        LEFT JOIN task t
            ON t.assignee = u.id AND t.assignee = ?
        LEFT JOIN ${ORGANISATION_TABLE} o
            ON o.id = u.organisation_id
        WHERE u.id = ?
    `, [id,id])

    if (user.length) {
        user[0].tasksTotalCount = Number(user[0].tasksTotalCount)
        return user[0]
    }

    return null
}

export async function getAllUsersFromOrganisationByUserId(userId) {
    let users = await query(`
        SELECT id FROM \`user\` u
        WHERE u.organisation_id = (
            SELECT organisation_id FROM user WHERE id = ?
        )
    `, [userId])

    return users.length ? users.map(u => u.id) : null
}

