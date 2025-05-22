import '@dotenvx/dotenvx/config'
import mariadb from 'mariadb'
import {
    DEFAULT_DB_VALUE,
    COMMENT_TABLE,
    CHECKLIST_TABLE,
} from '../src/definitions.mjs'

export const pool = mariadb.createPool({
    host: 'db',
    user: process.env.db_user,
    password: process.env.db_pass,
    database: process.env.db_name,
    connectionLimit: 5
})

export function mapTags(data) {
    return data.map(d => {
        const tags = !d.tags ? [] : d.tags.split(',')
        return {
            ...d,
            tags
        }
    })
}

export async function query(queryStatement, params = []) {
    let conn
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

export async function transactionQuery(queries) {
    let conn
    try {
        conn = await pool.getConnection()
        await conn.beginTransaction()
        await queries(conn)
        await conn.commit()
    } catch (err) {
        console.log(err)
        if (conn) conn.rollback()
    } finally {
        if (conn) conn.release()
    }
}



//const projectId = await getIdByDifferentId('project_id', COLUMN_PROJECT_TABLE, 'id', projectColumnId)
export async function getIdByDifferentId(selectId, table, whereId, whereIdValue) {
    const id = await query(`
        SELECT ${selectId}
        FROM ${pool.escapeId(table)}
        WHERE ${whereId} = ?;
    `, [whereIdValue])

    return id.length ? id[0][selectId] : null
}

// newProjectColumnId and newAgendaColumnId are bools

export async function generateUpdate(tableName, config, whereColumn, whereValue) {
    // config = { name: 'New task name', description: null, etc... }
    const configKeys = Object.keys(config)
    const queryStringSet = configKeys.map(column =>
        `${column} = ${config[column] === DEFAULT_DB_VALUE ? DEFAULT_DB_VALUE : '?'}`
    ).join(', ')
    const queryValues = Object.values(config).filter(v => v !== DEFAULT_DB_VALUE)
    queryValues.push(whereValue) // last query param will always be the where the value

    const result = await query(`
       UPDATE ${pool.escapeId(tableName)}
       SET ${queryStringSet}
       WHERE ${whereColumn} = ?;
    `, queryValues)

    if (!result || result.affectedRows !== 1 || result.warningStatus !== 0) {
        return false
    }

    return true
}

// need this becuase we dynamically insert values - we don't know if something is going to be a default value or not
// when paramerterising db query you need to define the default value in the VALUES list so can't use '?'
// config = { <columnName>: value, ... }
export async function generateInsert(tableName, config) {
    const error = new Error(`Failed to create new ${tableName}`)
    const columnNames = Object.keys(config).map(c => c !== 'row' && c !== 'column' ? c : `\`${c}\``) // adds backtick to reserved words
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


export async function getColumnColumns(table, whereColumn, whereColumnParam) {
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

