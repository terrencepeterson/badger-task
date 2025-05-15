import { transactionQuery } from "./db.mjs"
import { TASK_TABLE } from "../api/definitions.mjs"
const OFFSET_AMOUNT = 1000000

export async function moveTaskWithinColumn(taskId, symbol, biggerThan, lessThan, row, projectColumnId) {
    // move the current task to a temporary row - the row in an unsigned int so -1
    // offset all of the rows that we are changing so that they can't clash when changing them
    // change the rows of the affected tasks in the same column
    // move the current task to it's new row
    transactionQuery(async (conn) => {
        await disableCurrentTask(conn, taskId)
        await moveRows(conn, biggerThan, lessThan, taskId, projectColumnId, symbol)
        const tempRowRemoved = await conn.query(`
            UPDATE ${TASK_TABLE}
            SET project_row = ?
            WHERE id = ?
        `, [row, taskId])
    })
}

export async function moveTaskToEndOfNewColumn(newRow, newProjectColumnId, taskId, oldProjectColumnId, currentRow) {
    transactionQuery(async (conn) => {
        await conn.query(`
            UPDATE ${TASK_TABLE}
            SET project_row = ?, project_column_id = ?
            WHERE id = ?
        `, [newRow, newProjectColumnId, taskId]) // move task to new column

        const maxRow = await getMaxRow(conn, oldProjectColumnId)

        await moveRows(conn, currentRow, maxRow, taskId, oldProjectColumnId, '-') // decrement tasks from old column
    })
}

export async function moveTaskToNewColumn(taskId, oldProjectColumnId, oldRow, newProjectColumnId, newRow) {
    transactionQuery(async (conn) => {
        await disableCurrentTask(conn, taskId)
        const maxRowOldColumn = await getMaxRow(conn, oldProjectColumnId)
        const moveTasksFromOldColumn = await moveRows(conn, oldRow, maxRowOldColumn, taskId, oldProjectColumnId, '-')
        const maxRowNewColumn = await getMaxRow(conn, newProjectColumnId)
        if ((maxRowNewColumn + 1) !== newRow) { // if it's the end of the column no need to move any tasks
            const moveTasksNewColumn = await moveRows(conn, newRow -1, maxRowNewColumn + 1, taskId, newProjectColumnId, '+')
        }
        const moveTask = await conn.query(`
            UPDATE ${TASK_TABLE}
            SET project_column_id = ?, project_row = ?
            WHERE id = ?
        `, [newProjectColumnId, newRow, taskId])
    })
}

async function moveRows(conn, biggerThan, lessThan, taskId, projectColumnId, symbol) {
    const offSetRows = await conn.query(`
        UPDATE ${TASK_TABLE}
        SET project_row = project_row + ${OFFSET_AMOUNT}
        WHERE
            project_row > ? AND
            project_row < ? AND
            id != ? AND
            project_column_id = ?
    `, [biggerThan, lessThan, taskId, projectColumnId])

    // becuase we have offsetted the rows to avoid violating the row uniqueness constraint
    // here when moving the rows we need to adjust them to remove the offset again
    const updateRows = await conn.query(`
        UPDATE ${TASK_TABLE}
        SET project_row = project_row ${symbol} ${symbol === '-' ? OFFSET_AMOUNT + 1 : -1 * (OFFSET_AMOUNT - 1)}
        WHERE
            project_row > ? AND
            project_row < ? AND
            id != ? AND
            project_column_id = ?;
    `, [biggerThan + OFFSET_AMOUNT, lessThan + OFFSET_AMOUNT, taskId, projectColumnId])
}

async function disableCurrentTask(conn, taskId) {
    const tempRowChanged = await conn.query(`
        UPDATE ${TASK_TABLE}
        SET project_row = -1
        WHERE id = ?
    `, [taskId])
}

async function getMaxRow(conn, projectColumnId) {
    let maxRow = await conn.query(`
        SELECT MAX(project_row) as max_row
        FROM task
        WHERE project_column_id = ?;
    `, [projectColumnId])
    maxRow = maxRow.length ? maxRow[0].max_row + 1 : 0
    return maxRow
}
