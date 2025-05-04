import '@dotenvx/dotenvx/config'
import mariadb from 'mariadb'
import { DEFAULT_DB_VALUE } from './api/definitions.mjs'

const ACTIVE_USER_TABLE = 'active_user'
const USER_TABLE = 'user'
const COLUMN_AGENDA_TABLE = 'column_agenda'
const COLUMN_PROJECT_TABLE = 'column_project'
const PROJECT_TABLE = 'project'
const TASK_TABLE = 'task'
const ORGANISATION_TABLE = 'organisation'
const TAG_TABLE = 'tag'
const TASK_TAG_TABLE = 'task_tag'
const COMMENT_TABLE = 'comment'
const CHECKLIST_TABLE = 'checklist'
const TASK_COLUMN_AGENDA_TABLE = 'task_column_agenda'

const pool = mariadb.createPool({
    host: 'db',
    user: process.env.db_user,
    password: process.env.db_pass,
    database: process.env.db_name,
    connectionLimit: 5
})

function mapTags(data) {
    return data.map(d => {
        const tags = !d.tags ? [] : d.tags.split(',')
        return {
            ...d,
            tags
        }
    })
}

async function query(queryStatement, params = []) {
    let conn;
    try {
        conn = await pool.getConnection()
        const rows = await conn.query(queryStatement, params)
        return rows
    } catch (err) {
        console.error(err)
    } finally {
        if (conn) conn.release()
    }
}

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

export async function getOrganisationIdByUserId(userId) {
    let organisationId = await  query(`
        SELECT organisation_id
        FROM user
        WHERE user.id = ?;
    `, [userId])

    organisationId = organisationId[0].organisation_id
    return (!organisationId && organisationId !== 0) ? false : +organisationId
}

export async function belongsToOrganisation(userId) {
    const organisationId = await query(`
        SELECT organisation_id
        FROM user
        WHERE id = ?;
    `, [userId])

    return !!organisationId[0].organisation_id
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

// always called when a user is added
function addDefaultAgenda(userId) {
    return query(`
        INSERT INTO ${COLUMN_AGENDA_TABLE} (name, colour, \`column\`, user_id) VALUES
        ('Focus', '#FFAA00', 0, ?),
        ('Reply to', '#A179F2', 1, ?),
        ('Upcoming', '#2BD9D9', 2, ?),
        ('On hold', '#D01F2E', 3, ?);
    `, [userId, userId, userId, userId])
}

export async function getUserByEmail(email) {
    const user = await query(`
        SELECT id, email, password, role
        FROM ${USER_TABLE} where email = ?
    `, [email])

    return user.length ? user[0] : null
}

export function getProjectColumnColumns(projectId) {
    return getColumnColumns(COLUMN_PROJECT_TABLE, 'project_id', projectId)
}

export function getAgendaColumnColumns(userId) {
    return getColumnColumns(COLUMN_AGENDA_TABLE, 'user_id', userId)
}

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

export async function getDashboardTasks(userId, batchNumber = 0) {
    let tasks = await query(`
        SELECT
            tsk.id as taskId,
            tsk.name as taskName,
            tsk.state as taskState,
            cp.project_id as projectId,
            GROUP_CONCAT(tt.tag_id SEPARATOR ',') AS tags,
            ca.colour as agendaColour
        FROM task tsk
        LEFT JOIN column_project cp
            ON cp.id = tsk.project_column_id
        LEFT JOIN task_tag tt
            ON tt.task_id = tsk.id
        LEFT JOIN project p
            ON cp.project_id = p.id
        LEFT JOIN (
            SELECT tca.task_id, ca.colour
            FROM task_column_agenda tca
            INNER JOIN column_agenda ca
                ON ca.id = tca.column_agenda_id
            WHERE ca.user_id = ?
        ) ca
            ON ca.task_id = tsk.id
        WHERE tsk.assignee = ?
        GROUP BY
            tsk.id, tsk.name, tsk.state
        ORDER BY
            p.created_at ASC, cp.\`column\` ASC, tsk.project_row ASC
        LIMIT 5 OFFSET ?;
    `, [userId, userId, batchNumber * 5])

    tasks = mapTags(tasks)

    return tasks
}

export async function getTaskById(taskId, userId) {
    const task = await query(`
        SELECT
            tsk.id as taskId,
            tsk.name,
            tsk.description,
            tsk.due_date,
            tsk.state,
            tsk.created_at,
            u.name as assigneeName,
            u.img_url as assigneeImgUrl,
            p.name as projectName,
            ca.name as columnAgendaName,
            ca.colour as columnAgendaColour
        FROM ${TASK_TABLE} tsk
        LEFT JOIN ${USER_TABLE} u
            ON tsk.assignee = u.id
        LEFT JOIN ${COLUMN_PROJECT_TABLE} cp
            ON cp.id = tsk.project_column_id
        LEFT JOIN ${PROJECT_TABLE} p
            ON p.id = cp.project_id
        LEFT JOIN (
            SELECT tca.task_id, ca.name, ca.colour, ca.id
            FROM ${TASK_COLUMN_AGENDA_TABLE} tca
            INNER JOIN ${COLUMN_AGENDA_TABLE} ca
                ON ca.id = tca.column_agenda_id
            WHERE ca.user_id = ?
        ) ca
            ON ca.task_id = tsk.id
        WHERE tsk.id = ?;
    `, [userId, taskId])

    return task.length ? task[0] : null
}

export function getCommentsByTaskId(taskId) {
    return query(`
        SELECT
            c.id as commentId,
            c.text as comment,
            c.created_at as commentCreatedAt,
            u.name as commentCreatedBy,
            u.img_url as commentCreatedByImgUrl
        FROM ${COMMENT_TABLE} c
        LEFT JOIN ${USER_TABLE} u
            ON u.id = c.created_by
        WHERE c.task_id = ?
    `, [taskId])
}

export function getTagsByTaskId(taskId) {
    return query(`
        SELECT t.id as tagId, t.name as tagName, t.colour as tagColour
        FROM ${TAG_TABLE} t
        LEFT JOIN ${TASK_TAG_TABLE} tt
            ON tt.tag_id = t.id
        WHERE tt.task_id = ?
    `, [taskId])
}

export function getChecklistByTaskId(taskId) {
    return query(`
        SELECT c.id as checklistId, c.name as checklistName, c.state as checklistState
        FROM ${CHECKLIST_TABLE} c
        WHERE c.task_id = ?
    `, [taskId])
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
        FROM ${PROJECT_TABLE} p
        INNER JOIN ${COLUMN_PROJECT_TABLE} cp
            ON cp.project_id = p.id
        INNER JOIN ${TASK_TABLE} t
            ON t.project_column_id = cp.id
        INNER JOIN ${TASK_TAG_TABLE} tt
            ON tt.task_id = t.id
        INNER JOIN ${TAG_TABLE}
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

export function getProjectUsersByProjectId(projectId) {
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

export function getAgendaTasks(userId) {
    return query(`
        WITH RankedTasks AS (
            SELECT
                tsk.id AS taskId,
                tsk.name AS taskName,
                tsk.state,
                cp.project_id as projectId,
                ca.id AS columnAgendaId,
                tca.row,
                tsk.assignee,
                ROW_NUMBER() OVER (PARTITION BY tca.column_agenda_id ORDER BY tca.row ASC) AS rn,
                GROUP_CONCAT(tt.tag_id SEPARATOR ',') AS tags
            FROM column_agenda ca
            INNER JOIN task_column_agenda tca
                ON tca.column_agenda_id = ca.id
            INNER JOIN task tsk
                ON tsk.id = tca.task_id
            INNER JOIN column_project cp
                ON cp.id = tsk.project_column_id
            LEFT JOIN task_tag tt
                ON tt.task_id = tsk.id
            WHERE ca.user_id = ?
            GROUP BY taskId, taskName, state, projectId, columnAgendaId, row, assignee
        )
        SELECT taskId, taskName, state, projectId, columnAgendaId, row, assignee, tags
        FROM RankedTasks
        WHERE rn <= 5;
    `, [userId])
}

export async function getAgendaColumns(userId) {
    let columns = await query(`
        SELECT
            ca.id,
            ca.name,
            ca.colour,
            COUNT (tca.task_id) as taskCount -- if no tasks then 0
        FROM column_agenda ca
        LEFT JOIN task_column_agenda tca
            ON tca.column_agenda_id = ca.id
        WHERE ca.user_id = ?
        GROUP BY ca.id;
    `, [userId])

    columns = columns.map(c => ({
        ...c,
        taskCount: Number(c.taskCount)
    }))

    return columns
}

export function getAgendaUsers(userId) {
    return query(`
        SELECT DISTINCT
            u.id,
            u.name,
            u.img_url
        FROM column_agenda ca
        INNER JOIN task_column_agenda tca
            ON tca.column_agenda_id = ca.id
        INNER JOIN task tsk
            ON tsk.id = tca.task_id
        INNER JOIN user u
            ON u.id = tsk.assignee
        WHERE ca.user_id = ?;
    `, [userId])
}

export function getAgendaTags(userId) {
    return query(`
        SELECT DISTINCT
            t.id,
            t.name,
            t.colour
        FROM column_agenda ca
        INNER JOIN task_column_agenda tca
            ON tca.column_agenda_id = ca.id
        INNER JOIN task_tag tt
            ON tt.task_id = tca.task_id
        INNER JOIN tag t
            ON t.id = tt.tag_id
        WHERE ca.user_id = ?;
    `, [userId])
}

export function getAgendaProjects(userId) {
    return query(`
        SELECT DISTINCT
            p.id,
            p.img_url,
            p.name
        FROM column_agenda ca
        INNER JOIN task_column_agenda tca
            ON tca.column_agenda_id = ca.id
        INNER JOIN task t
            ON t.id = tca.task_id
        INNER JOIN column_project cp
            ON cp.id = t.project_column_id
        INNER JOIN project p
            ON p.id = cp.project_id
        WHERE ca.user_id = ?;
    `, [userId])
}

export async function getAgendaColumn(columnId, row) {
    let tasks = await query(`
        SELECT
            task.id,
            task.name,
            task.state,
            task.assignee,
            cp.project_id as projectId,
            tca.row,
            GROUP_CONCAT(tt.tag_id SEPARATOR ',') AS tags
        FROM task_column_agenda tca
        INNER JOIN task
            ON task.id = tca.task_id
        INNER JOIN column_project cp
            ON cp.id = task.project_column_id
        LEFT JOIN task_tag tt
            ON tt.task_id = task.id
        WHERE tca.column_agenda_id = ?
        AND row > ?
        GROUP BY id, name, state, assignee, projectId, \`row\`
        ORDER BY tca.row
        LIMIT 5;
    `, [columnId, row])

    tasks = mapTags(tasks)

    return tasks
}

export async function getTaskAccess(userId) {
    let tasks = await query(`
        SELECT
            t.id
        FROM task t
        LEFT JOIN column_project cp
            ON cp.id = t.project_column_id
        LEFT JOIN project p
            ON p.id = cp.project_id
        LEFT JOIN user u
            ON u.organisation_id = p.organisation_id
        LEFT JOIN user_project up
            ON up.project_id = p.id
        WHERE
            u.id = ? AND
            p.private = FALSE OR
            p.private = TRUE and up.user_id = ?;
    `, [userId, userId])

    tasks = tasks ? tasks.map(t => `${t.id}`) : []

    return tasks
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

export function createProject(userId, organisation_id, name, description, isPrivate, img_url) {
    return generateInsert(PROJECT_TABLE, {name, created_by: userId, organisation_id, description, private: isPrivate, img_url})
}

export function createProjectColumn(name, icon, colour, column, project_id) {
    return generateInsert(COLUMN_PROJECT_TABLE, { name, icon, colour, column, project_id })
}

export function createAgendaColumn(name, colour, column, user_id) {
    return generateInsert(COLUMN_AGENDA_TABLE, { name, colour, column, user_id })
}

// need this becuase we dynamically insert values - we don't know if something is going to be a default value or not
// when paramerterising db query you need to define the default value in the VALUES list so can't use '?'
// config = { <columnName>: value, ... }
async function generateInsert(tableName, config) {
    const error = new Error(`Failed to create new ${tableName}`)
    const columnNames = Object.keys(config).map(c => c !== 'row' && c !== 'column' ? c : '`' + c + '`') // adds backtick to reserved words
    const queryStringColumns = columnNames.join(', ')
    const values = Object.values(config)
    const queryStringValues = values.map(v => v === DEFAULT_DB_VALUE ? v : '?').join(', ')
    const queryValues = values.filter(v => v !== DEFAULT_DB_VALUE)
    const result = await query(`
        INSERT INTO ${pool.escapeId(tableName)} (${queryStringColumns})
        VALUES (${queryStringValues})
    `, queryValues)

    if (!result) {
        throw error
    }

    const resultId = parseInt(result.insertId)
    if (result.warningStatus !== 0 || result.affectedRows !== 1 || isNaN(resultId)) {
        throw error
    }

    return resultId
}

async function getColumnColumns(table, whereColumn, whereColumnParam) {
    const column = await query(`
        SELECT \`column\`
        FROM ${pool.escapeId(table)}
        WHERE ${whereColumn} = ?
        ORDER BY \`column\` DESC;
    `, [whereColumnParam])

    return column.length ? column.map(c => c.column) : false
}

process.on('SIGINT', async () => {
    console.log("Closing database connection pool...");
    await pool.end();
    process.exit();
});

