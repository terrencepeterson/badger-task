import '@dotenvx/dotenvx/config'
import mariadb from 'mariadb'

const ACTIVE_USER_TABLE = 'active_user'
const AGENDA_COLS_TABLE = 'column_agenda'
const USER_TABLE = 'user'

const pool = mariadb.createPool({
    host: 'db',
    user: process.env.db_user,
    password: process.env.db_pass,
    database: process.env.db_name,
    connectionLimit: 5
})

async function query(queryStatement, rethrowError = false) {
    let conn;
    try {
        conn = await pool.getConnection()
        const rows = await conn.query(queryStatement)
        return rows
    } catch (err) {
        console.error(err)

        if (rethrowError) {
            throw new Error(rethrowError.message)
        }
    } finally {
        if (conn) conn.release()
    }
}

export async function getUserEmails() {
    const emails = await query(`
        SELECT email
        FROM ${ACTIVE_USER_TABLE}
    `)

    if (!emails || !emails.length) {
        return []
    }

    return emails.map(e => e.email)
}

export async function addUser({ name, email, description, role, password, img_url }) {
    const addQuotes = (value) => {
        if (value === 'NULL' || value === 'DEFAULT') {
            return value
        }

        return `'${value}'`
    }

    const data = await query(`
        INSERT INTO ${USER_TABLE} (name, email, description, role, password, img_url)
        VALUES ('${name}', '${email}', ${addQuotes(description)}, ${role}, '${password}', ${addQuotes(img_url)})
    `, { message: 'Failed to add user to database'})

    const userId = Number(data.insertId)
    await addDefaultAgenda(userId)

    const user = await query(`
        SELECT id, name, email, img_url, created_at
        FROM ${USER_TABLE} where id = ${userId}
    `)

    return user[0]
}

// always called when a user is added
function addDefaultAgenda(userId) {
    return query(`
        INSERT INTO ${AGENDA_COLS_TABLE} (name, colour, \`column\`, user_id) VALUES
        ('Focus', '#FFAA00', 0, ${userId}),
        ('Reply to', '#A179F2', 1, ${userId}),
        ('Upcoming', '#2BD9D9', 2, ${userId}),
        ('On hold', '#D01F2E', 3, ${userId});
    `, {message: 'Failed to add default agenda cols to database'})
}

export async function getUserByEmail(email) {
    const user = await query(`
        SELECT id, email, password, role
        FROM ${USER_TABLE} where email = '${email}'
    `)

    return user.length ? user[0] : null
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
        FROM user u
        LEFT JOIN task t
            ON t.assignee = u.id AND t.assignee = ${id}
        INNER JOIN organisation o
            ON o.id = u.organisation_id
        WHERE u.id = ${id}
    `)

    if (user.length) {
        user[0].tasksTotalCount = Number(user[0].tasksTotalCount)
        return user[0]
    }

    return null
}

export function getProjectsByUserId(userId) {
     return query(`
        SELECT
            p.id as projectId,
            p.name as projectName,
            p.img_url as projectImgUrl
        FROM project p
        LEFT JOIN organisation o
            ON o.id = p.organisation_id
        LEFT JOIN user u
            ON u.id = ${userId}
        WHERE u.organisation_id = o.id;
    `)
}

export function getTagsByUserId(userId) {
    // only gets the tags that are related to tasks that are assigned to the user
    return query(`
        SELECT DISTINCT
            t.id as tagId,
            t.name as tagName,
            t.colour as tagColour
        FROM tag t
        INNER JOIN task_tag tt
            ON tt.tag_id = t.id
        INNER JOIN task tsk
            ON tsk.id = tt.task_id
        WHERE tsk.assignee = ${userId};
    `)
}

export function getDashboardTasks(id, lastTaskId = 0) {
    return query(`
        SELECT
            tsk.id as taskId,
            tsk.name as taskName,
            tsk.state as taskState,
            cp.project_id as projectId,
            GROUP_CONCAT(tt.tag_id SEPARATOR ',') AS tags
        FROM task tsk
        LEFT JOIN column_project cp
            ON cp.id = tsk.project_column_id
        LEFT JOIN task_tag tt
            ON tt.task_id = tsk.id
        LEFT JOIN project p
            ON cp.project_id = p.id
        WHERE tsk.assignee = ${id}
        AND tsk.id > ${lastTaskId}
        GROUP BY
            tsk.id, tsk.name, tsk.state
        ORDER BY
            p.created_at ASC
        LIMIT 5;
    `)
}

process.on('SIGINT', async () => {
    console.log("Closing database connection pool...");
    await pool.end();
    process.exit();
});

