import { ORGANISATION_TABLE } from "../../definitions.mjs"
import { query, generateInsert } from "../../db.mjs"

export async function getOrganisationIdByUserId(userId) {
    let organisationId = await  query(`
        SELECT organisation_id
        FROM user
        WHERE user.id = ?;
    `, [userId])

    organisationId = organisationId[0].organisation_id
    return (!organisationId && organisationId !== 0) ? [] : +organisationId
}

export async function belongsToOrganisation(userId) {
    const organisationId = await query(`
        SELECT organisation_id
        FROM user
        WHERE id = ?;
    `, [userId])

    return !!organisationId[0].organisation_id
}

export async function getAllUsersFromOrganisation(organisationId) {
    let allUsers = await query(`
        SELECT u.id
        FROM \`user\` u
        WHERE u.organisation_id = ?
    `, [organisationId])

    if (allUsers.length) {
        allUsers = allUsers.map(u => u.id)
    } else {
        throw new Error('Critical - no users belong to the current organisation')
    }

    return allUsers
}

export async function createOrganisation(userId, name) {
    const organisationId = await generateInsert(ORGANISATION_TABLE, { name })
    if (!organisationId) {
        throw new Error('Failed to create organisation')
    }

    const updateUser = await query(`
        UPDATE user
        SET role = 'admin', organisation_id = ?
        WHERE user.id = ?;
    `, [organisationId, userId])

    if (updateUser.warningStatus !== 0 || updateUser.affectedRows !== 1) {
        return false
    }

    return organisationId
}

