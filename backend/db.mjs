import '@dotenvx/dotenvx/config'
import mariadb from 'mariadb'

const ACTIVE_USER_TABLE = 'active_user'
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
    const user = await query(`
        SELECT id, name, email, img_url, created_at
        FROM ${USER_TABLE} where id = ${userId}
    `)

    return user[0]
}

export async function getUserByEmail(email) {
    const user = await query(`
        SELECT id, email, password, role
        FROM ${USER_TABLE} where email = '${email}'
    `)

    return user.length ? user[0] : null
}

process.on('SIGINT', async () => {
    console.log("Closing database connection pool...");
    await pool.end();
    process.exit();
});

