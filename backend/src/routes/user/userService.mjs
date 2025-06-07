import { defaultBackgroundLink, defaultOrganisationAvatarLink, defaultUserAvatarLink } from "../../cloudinary.mjs"
import { query } from "../../db.mjs"
import { USER_TABLE, ORGANISATION_TABLE, AVATAR_IMAGE_TYPE, BACKGROUND_IMAGE_TYPE } from "../../definitions.mjs"
import { convertDbImgToUrl } from "../../utility.mjs"

export async function getUserDashboard(id) {
    let user = await query(`
        SELECT
            COUNT(DISTINCT t.id) AS tasksTotalCount,
            u.id as userId,
            o.id as organisationId,
            u.name as userName,
            u.avatar_img_version as user_avatar_img_version,
            u.background_img_version,
            u.description as userDescription,
            o.name as organisationName,
            o.avatar_img_version as organisation_avatar_img_version
        FROM ${USER_TABLE} u
        LEFT JOIN task t
            ON t.assignee = u.id AND t.assignee = ?
        LEFT JOIN ${ORGANISATION_TABLE} o
            ON o.id = u.organisation_id
        WHERE u.id = ?
    `, [id,id])
    l(user)

    if (!user.length) {
        return null
    }

    user = convertDbImgToUrl(user[0], 'user_' + AVATAR_IMAGE_TYPE, AVATAR_IMAGE_TYPE, defaultUserAvatarLink, USER_TABLE, user[0].userId)
    user = convertDbImgToUrl(user, 'organisation_' + AVATAR_IMAGE_TYPE, AVATAR_IMAGE_TYPE, defaultOrganisationAvatarLink, ORGANISATION_TABLE, user.organisationId)
    user = convertDbImgToUrl(user, BACKGROUND_IMAGE_TYPE, BACKGROUND_IMAGE_TYPE, defaultBackgroundLink, USER_TABLE, user.userId)
    user.tasksTotalCount = Number(user.tasksTotalCount)
    delete user.organisationId

    return user
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

