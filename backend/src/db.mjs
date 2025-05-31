import '@dotenvx/dotenvx/config'
import mariadb from 'mariadb'
import {
    COLUMN_AGENDA_TABLE,
    COLUMN_PROJECT_TABLE,
    DEFAULT_DB_VALUE,
} from '../src/definitions.mjs'
const OFFSET_AMOUNT = 1000000

const columnKeys = {
    [COLUMN_AGENDA_TABLE]: {
        columnFilterName: 'user_id'
    },
    [COLUMN_PROJECT_TABLE]: {
        columnFilterName: 'project_id'
    }
}

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
        if (conn) conn.rollback()
        throw err
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

export async function deleteRow(table, id) {
    const hasDeleted = await query(`
        DELETE FROM ${pool.escapeId(table)} WHERE id = ?
    `, [id])

    console.log(hasDeleted)
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

// this is needed becuase when we peform access control on the endponts where we don't store their values in the cache
// (checklist, comment, tag, etc...) we need to rely on their 'parentId' for access control, an issue here...
// when updating a comment a user could give us a taskId they have access to and then pass a completly different comment id
// that doesn't actually match the taskId. So we use this function to check to see if the resource ids match
export async function doIdsMatch(table, childId, parentIdColumnName, parentId) {
    const doesMatch = await query(`
        SELECT id from ${table}
        WHERE id = ? AND ${parentIdColumnName} = ?
    `, [childId, parentId])

    return !!doesMatch.length
}

export function moveColumn(columnId, newColumn, biggerThan, lessThan, symbol, columnFilter, table) {
    return transactionQuery(async (conn) => {
        let hasMoved = await conn.query(`
            UPDATE ${table}
            SET \`column\` = -1
            WHERE id = ?
        `, [columnId])
        if (hasMoved.affectedRows !== 1 || hasMoved.warningStatus !== 0) {
            throw new Error('Failed to move column')
        }

        await moveColumnsInRange(conn, biggerThan, lessThan, columnId, columnFilter, symbol, table)

        hasMoved = await conn.query(`
            UPDATE ${table}
            SET \`column\` = ?
            WHERE id = ?
        `, [newColumn, columnId])
        if (hasMoved.affectedRows !== 1 || hasMoved.warningStatus !== 0) {
            throw new Error('Failed to move column')
        }

        return true
    })
}

async function moveColumnsInRange(conn, biggerThan, lessThan, columnId, columnFilter, symbol, table) {
    const { columnFilterName } = columnKeys[table]
    await conn.query(`
        UPDATE ${table}
        SET \`column\` = \`column\` + ?
        WHERE \`column\` > ?
        AND \`column\` < ?
        AND id != ?
        AND ${columnFilterName} = ?
    `, [OFFSET_AMOUNT, biggerThan, lessThan, columnId, columnFilter])

    await conn.query(`
        UPDATE ${table}
        SET \`column\` = \`column\` - ?
        WHERE \`column\` > ?
        AND \`column\` < ?
        AND id != ?
        AND ${columnFilterName} = ?
    `, [(symbol === '+') ? OFFSET_AMOUNT - 1 : OFFSET_AMOUNT + 1, biggerThan + OFFSET_AMOUNT, lessThan + OFFSET_AMOUNT, columnId, columnFilter])
}

process.on('SIGINT', async () => {
    console.log("Closing database connection pool...");
    await pool.end();
    process.exit();
});

