import { transactionQuery } from "./db.mjs"
import { COLUMN_AGENDA_TABLE, TASK_TABLE } from "../api/definitions.mjs"
const OFFSET_AMOUNT = 1000000

const columnKeys = {
    [TASK_TABLE]: {
        rowColumn: 'project_row',
        taskIdColumn: 'id',
        columnIdColumn: 'project_column_id'
    },
    [COLUMN_AGENDA_TABLE]: {
        rowColumn: '`row`',
        taskIdColumn: 'task_id',
        columnIdColumn: 'column_agenda_id'
    }
}

export async function moveTaskWithinColumn(taskId, symbol, biggerThan, lessThan, row, projectColumnId, activeTable) {
    // move the current task to a temporary row - the row in an unsigned int so -1
    // offset all of the rows that we are changing so that they can't clash when changing them
    // change the rows of the affected tasks in the same column
    // move the current task to it's new row
    const { rowColumn, taskIdColumn } = columnKeys[activeTable]
    transactionQuery(async (conn) => {
        await disableCurrentTask(conn, taskId, activeTable)
        await moveRows(conn, biggerThan, lessThan, taskId, projectColumnId, symbol, activeTable)
        await conn.query(`
            UPDATE ${activeTable}
            SET ${rowColumn} = ?
            WHERE ${taskIdColumn} = ?
        `, [row, taskId])
    })
}

export async function moveTaskToEndOfNewColumn(newRow, newProjectColumnId, taskId, oldProjectColumnId, currentRow, maxRow, activeTable) {
    const { rowColumn, taskIdColumn, columnIdColumn } = columnKeys[activeTable]
    transactionQuery(async (conn) => {
        await conn.query(`
            UPDATE ${activeTable}
            SET ${rowColumn} = ?, ${columnIdColumn} = ?
            WHERE ${taskIdColumn} = ?
        `, [newRow, newProjectColumnId, taskId]) // move task to new column

        await moveRows(conn, currentRow, maxRow, taskId, oldProjectColumnId, '-', activeTable) // decrement tasks from old column
    })
}

export async function moveTaskToNewColumn(taskId, oldProjectColumnId, oldRow, newProjectColumnId, newRow, maxRowCurrentColumn, maxRowNewColumn, activeTable) {
    const { rowColumn, taskIdColumn, columnIdColumn } = columnKeys[activeTable]
    console.log()
    transactionQuery(async (conn) => {
        await disableCurrentTask(conn, taskId, activeTable)

        if (oldRow !== (maxRowCurrentColumn - 1)) { // if at end of oldColumn no need to move any tasks
            await moveRows(conn, oldRow, maxRowCurrentColumn, taskId, oldProjectColumnId, '-', activeTable) // move roms from old column
        }

        if ((maxRowNewColumn) !== newRow) { // if at end of the newColumn no need to move any tasks
            await moveRows(conn, newRow -1, maxRowNewColumn, taskId, newProjectColumnId, '+', activeTable) // move rows in new column
        }

        await conn.query(`
            UPDATE ${TASK_TABLE}
            SET ${columnIdColumn} = ?, ${rowColumn} = ?
            WHERE ${taskIdColumn} = ?
        `, [newProjectColumnId, newRow, taskId])
    })
}

async function disableCurrentTask(conn, taskId, activeTable) {
    const { rowColumn, taskIdColumn } = columnKeys[activeTable]
    await conn.query(`
        UPDATE ${activeTable}
        SET ${rowColumn} = -1
        WHERE ${taskIdColumn} = ?
    `, [taskId])
}

async function moveRows(conn, biggerThan, lessThan, taskId, projectColumnId, symbol, activeTable) {
    // offset the rows to avoid violating the unique project row within column constraint
    const { rowColumn, taskIdColumn, columnIdColumn } = columnKeys[activeTable]
    await conn.query(`
        UPDATE ${activeTable}
        SET ${rowColumn} = ${rowColumn} + ${OFFSET_AMOUNT}
        WHERE
            ${rowColumn} > ? AND
            ${rowColumn} < ? AND
            ${taskIdColumn} != ? AND
            ${columnIdColumn} = ?
    `, [biggerThan, lessThan, taskId, projectColumnId])

    // becuase we have offsetted the rows to avoid violating the row uniqueness constraint
    // here when moving the rows we need to adjust them to remove the offset again
    await conn.query(`
        UPDATE ${activeTable}
        SET ${rowColumn} = ${rowColumn} ${symbol} ${symbol === '-' ? OFFSET_AMOUNT + 1 : -1 * (OFFSET_AMOUNT - 1)}
        WHERE
            ${rowColumn} > ? AND
            ${rowColumn} < ? AND
            ${taskIdColumn} != ? AND
            ${columnIdColumn} = ?;
    `, [biggerThan + OFFSET_AMOUNT, lessThan + OFFSET_AMOUNT, taskId, projectColumnId])
}

