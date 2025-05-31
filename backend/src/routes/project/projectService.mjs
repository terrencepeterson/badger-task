import { query, mapTags, generateInsert, transactionQuery, getColumnColumns, pool } from "../../db.mjs"
import { PROJECT_TABLE, COLUMN_PROJECT_TABLE, TASK_TABLE, USER_TABLE, TASK_TAG_TABLE, TASK_COLUMN_AGENDA_TABLE, COLUMN_AGENDA_TABLE, TAG_TABLE, ROLE_ADMIN } from "../../definitions.mjs"

export async function getEditProjectHelperColumns(projectId) {
    const editProjectHelperColumns = await query(`
        SELECT private, organisation_id
        FROM project
        WHERE id = ?
    `, [projectId])

    if (editProjectHelperColumns && editProjectHelperColumns.length) {
        return {
            currentPrivateStatus: !!editProjectHelperColumns[0].private,
            organisationId: editProjectHelperColumns[0].organisation_id
        }
    }
}

export async function getProjectColumnRows(projectColumnId) {
    const projectRows = await query(`
        SELECT t.project_row
        FROM task t
        WHERE t.project_column_id = ?
        ORDER BY t.project_row DESC;
    `, [projectColumnId])

    return projectRows.length ? projectRows.map(r => r.project_row) : false
}

export function getProjectsByUserId(userId) {
     return query(`
        SELECT DISTINCT
            p.id as projectId,
            p.name as projectName,
            p.img_url as projectImgUrl,
            p.private
        FROM project p
        LEFT JOIN user_project up
            ON up.project_id = p.id
        LEFT JOIN organisation o
            ON o.id = p.organisation_id
        LEFT JOIN user u
            ON u.organisation_id = o.id
        WHERE
            u.id = ? AND
            p.private = FALSE OR
            p.private = TRUE AND up.user_id = ?;
    `, [userId, userId])
}

export async function getProjectByProjectId(projectId) {
    const project = await query(`
        SELECT
            p.name,
            p.img_url,
            p.created_at,
            p.description,
            u.name as createdBy
        FROM project p
        INNER JOIN user u
            ON u.id = p.created_by
        WHERE p.id = ?
    `, [projectId])

    return project.length ? project[0] : null
}

export async function getProjectTasks(projectId, userId) {
    let projectTasks = await query(`
        WITH RankedTasks AS (
            SELECT
                tsk.id AS taskId,
                tsk.name AS taskName,
                tsk.state,
                tsk.project_row as row,
                cp.id AS columnProjectId,
                u.id as assigneeId,
                ROW_NUMBER() OVER (PARTITION BY cp.id ORDER BY tsk.project_row ASC) AS rn,
                ca.colour as agendaColour,
                GROUP_CONCAT(tt.tag_id SEPARATOR ',') AS tags
            FROM ${PROJECT_TABLE} p
            LEFT JOIN ${COLUMN_PROJECT_TABLE} cp
                ON cp.project_id = p.id
            INNER JOIN ${TASK_TABLE} tsk
                ON tsk.project_column_id = cp.id
            LEFT JOIN ${USER_TABLE} u
                ON u.id = tsk.assignee
            LEFT JOIN ${TASK_TAG_TABLE} tt
                ON tt.task_id = tsk.id
            LEFT JOIN (
                SELECT ca.colour, tca.task_id
                FROM ${TASK_COLUMN_AGENDA_TABLE} tca
                INNER JOIN ${COLUMN_AGENDA_TABLE} ca
                    ON ca.id = tca.column_agenda_id
                WHERE ca.user_id = ?
            ) ca
                ON ca.task_id = tsk.id
            WHERE p.id = ?
            GROUP BY taskId, taskName, state, columnProjectId, row, assigneeId, agendaColour
        )
        SELECT taskId, taskName, state, columnProjectId, row, assigneeId, agendaColour, tags
        FROM RankedTasks
        WHERE rn <= 5;
    `, [userId, projectId])

    projectTasks = mapTags(projectTasks)

    return projectTasks
}

export async function getProjectColumn(columnId, row, userId) {
    let tasks = await query(`
        SELECT
            t.id,
            t.name,
            t.state,
            t.assignee,
            t.project_row,
            GROUP_CONCAT(tt.tag_id SEPARATOR ',') AS tags,
            ca.colour as agendaColumnColour
        FROM task t
        LEFT JOIN task_tag tt
            ON tt.task_id = t.id
        LEFT JOIN (
            SELECT ca.colour, tca.task_id
            FROM column_agenda ca
            INNER JOIN task_column_agenda tca
                ON tca.column_agenda_id = ca.id
            WHERE ca.user_id = ?
        ) ca
            ON ca.task_id = t.id
        WHERE t.project_column_id = ?
        AND t.project_row > ?
        GROUP BY id, name, state, assignee, project_row, agendaColumnColour
        LIMIT 5;
    `, [userId, columnId, row])

    tasks = mapTags(tasks)

    return tasks
}

export function getProjectTags(projectId) {
    return query(`
        SELECT DISTINCT
            tag.id,
            tag.name,
            tag.colour
        FROM project p
        INNER JOIN column_project cp
            ON cp.project_id = p.id
        INNER JOIN task t
            ON t.project_column_id = cp.id
        INNER JOIN task_tag tt
            ON tt.task_id = t.id
        INNER JOIN tag
            ON tag.id = tt.tag_id
        WHERE p.id = ?
    `, [projectId])
}

export async function getProjectColumnsByProjectId(projectId) {
    let columns = await query(`
        SELECT
            cp.id,
            cp.name,
            cp.colour,
            cp.icon,
            CAST(COUNT(t.id) AS UNSIGNED) AS taskCount
        FROM column_project cp
        LEFT JOIN task t
            ON t.project_column_id = cp.id
        WHERE cp.project_id = ?
        GROUP BY id, name, colour, icon;
    `, [projectId])

    if (columns.length) {
        columns = columns.map(c => ({...c, taskCount: Number(c.taskCount)}))
    }

    return columns
}

export function getProjectUsersWAssigneedTask(projectId) {
// gets users which have been assigned to a task in the project
    return query(`
        SELECT DISTINCT
            u.id,
            u.name,
            u.img_url
        FROM user u
        INNER JOIN task t ON t.assignee = u.id
        INNER JOIN column_project cp ON cp.id = t.project_column_id
        INNER JOIN project p ON p.id = cp.project_id
        WHERE p.id = ?;
    `, [projectId])
}

export async function getProjectsAccess(userId) {
    // used to convert data from "1,2,3,4" -> ['1', '2'...] must be strings for redis
    const convertStringToArrayStrings = (data) => data ? data.split(',').map(d => `${d}`) : []

    const projectsAndColumnProjects = await query(`
        SELECT DISTINCT
            GROUP_CONCAT(DISTINCT p.id SEPARATOR ',') AS projects,
            GROUP_CONCAT(DISTINCT cp.id SEPARATOR ',') AS columnProjects
        FROM project p
        LEFT JOIN user_project up
            ON up.project_id = p.id
        LEFT JOIN organisation o
            ON o.id = p.organisation_id
        LEFT JOIN user u
            ON u.organisation_id = o.id
        LEFT JOIN column_project cp
            ON cp.project_id = p.id
        WHERE
            u.id = ? AND
            p.private = FALSE OR
            p.private = TRUE AND up.user_id = ?;
    `, [userId, userId])

    return {
        projects: convertStringToArrayStrings(projectsAndColumnProjects[0].projects),
        columnProjects: convertStringToArrayStrings(projectsAndColumnProjects[0].columnProjects),
    }
}

export function createProject(userId, organisation_id, name, description, isPrivate, img_url) {
    return generateInsert(PROJECT_TABLE, {name, created_by: userId, organisation_id, description, private: isPrivate, img_url})
}

export async function getUserProjectAccess(projectId) {
    // gets all of the users who can access a prject
    let users = await query(`
        (
            SELECT u.id AS user_id
            FROM user u
            JOIN project p ON p.organisation_id = u.organisation_id
            WHERE p.id = ? AND p.private = FALSE
        )
        UNION ALL
        (
            SELECT up.user_id
            FROM user_project up
            JOIN project p ON p.id = up.project_id
            WHERE p.id = ? AND p.private = TRUE
        );
    `, [projectId, projectId])

    users = users.length ? users.map(u => u.user_id) : null

    if (!users) {
        throw new Error('CRITICAL - no users are part of that project')
    }

    return users
}

export async function disableProjectPrivateStatus(projectId) {
    transactionQuery(async (conn) => {
        const isNonPrivate = await conn.query(`
            UPDATE project
            SET private = 0
            WHERE id = ?;
        `, [projectId])

        if (isNonPrivate.affectedRows !== 1 || isNonPrivate.warningStatus !== 0) {
            throw new Error('Failed to disable the private status of the project')
        }

        const hasDeletedUserProject = await conn.query(`
            DELETE FROM user_project
            WHERE project_id = ?;
        `, [projectId])
    })
}

export async function enableProjectPrivateStatus(projectId, organisationId) {
    const isPrivate = await query(`
        UPDATE project
        SET private = 1
        WHERE id = ?;
    `, [projectId])

    if (isPrivate.affectedRows !== 1 || isPrivate.warningStatus !== 0) {
        throw new Error('Failed to enable the private status of the project')
    }

    return await updateUserProjectTable(organisationId, projectId)
}

export async function updateUserProjectTable(organisationId, projectId) {
    let admins = await query(`
        SELECT u.id
        FROM user u
        WHERE u.organisation_id = ? AND u.\`role\` = '${ROLE_ADMIN}'
    `, [organisationId])

    if (!admins.length) {
        throw new Error('Critical - No admin assigned to organisation')
    }

    const adminValues = admins.map(a => a.id)
    const adminInsertValues = adminValues.map(adminId => `(${pool.escape(projectId)}, ${pool.escape(adminId)})`).join(', ')
    const hasInsertedAdmins = await query(`
        INSERT INTO user_project (project_id, user_id)
        VALUES ${adminInsertValues}
    `)

    if (!hasInsertedAdmins || hasInsertedAdmins.affectedRows !== admins.length || hasInsertedAdmins.warningStatus !== 0) {
        throw new Error('Failed to update user_project access table')
    }

    return adminValues
}

export function getProjectColumnColumns(projectId) {
    return getColumnColumns(COLUMN_PROJECT_TABLE, 'project_id', projectId)
}

export function createProjectColumn(name, icon, colour, column, project_id) {
    return generateInsert(COLUMN_PROJECT_TABLE, { name, icon, colour, column, project_id })
}

export function getTagsByUserId(userId) {
    // only gets the tags that are related to tasks that are assigned to the user
    return query(`
        SELECT DISTINCT
            t.id as tagId,
            t.name as tagName,
            t.colour as tagColour
        FROM ${TAG_TABLE} t
        INNER JOIN ${TASK_TAG_TABLE} tt
            ON tt.tag_id = t.id
        INNER JOIN ${TASK_TABLE} tsk
            ON tsk.id = tt.task_id
        WHERE tsk.assignee = ?;
    `, [userId])
}

export function createTag(name, colour, project_id) {
    return generateInsert(TAG_TABLE, { name, colour, project_id })
}

export async function getMoveProjectColumnHelperData(projectId, projectColumnId) {
    const helperData = await query(`
            SELECT
                \`column\` as currentColumn,
                (SELECT MAX(\`column\`) FROM column_project WHERE project_id = ?) as maxColumn
            FROM column_project
            WHERE id = ?;
    `, [projectId, projectColumnId])
    if (!helperData.length) {
        throw new Error('Invalid project column')
    }

    return helperData[0]
}

