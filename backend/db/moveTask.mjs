import { transactionQuery } from "./db.mjs"
import { TASK_TABLE } from "../api/definitions.mjs"
const OFFSET_AMOUNT = 1000000

export async function moveTaskWithinRow(taskId, symbol, biggerThan, lessThan, row, projectColumnId) {
    // move the current task to a temporary row - the row in an unsigned int so -1
    // offset all of the rows that we are changing so that they can't clash when changing them
    // change the rows of the affected tasks in the same column
    // move the current task to it's new row
    transactionQuery(async (conn) => {
        const tempRowChanged = await conn.query(`
            UPDATE ${TASK_TABLE}
            SET project_row = -1
            WHERE id = ?
        `, [taskId])

        console.log(tempRowChanged)

        await moveRows(conn, biggerThan, lessThan, taskId, projectColumnId, symbol)

        const tempRowRemoved = await conn.query(`
            UPDATE ${TASK_TABLE}
            SET project_row = ?
            WHERE id = ?
        `, [row, taskId])
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
