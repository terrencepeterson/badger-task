import { query, transactionQuery, mapTags, generateInsert, getColumnColumns } from "../../db.mjs"
import { COLUMN_AGENDA_TABLE } from "../../definitions.mjs"

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

export function createAgendaColumn(name, colour, column, user_id) {
    return generateInsert(COLUMN_AGENDA_TABLE, { name, colour, column, user_id })
}

export function getAgendaColumnColumns(userId) {
    return getColumnColumns(COLUMN_AGENDA_TABLE, 'user_id', userId)
}

export async function getColumnByAgendaColumnId(agendaColumnId) {
    let helperData = await query(`
        SELECT \`column\` as currentColumn
        FROM column_agenda
        WHERE id = ?
    `, [agendaColumnId])

    return helperData.length ? helperData[0].currentColumn : false
}

export async function deleteAgendaColumn(userId, columnAgendaId) {
    transactionQuery(async (conn) => {
        const helperData = await conn.query(`
            SELECT
                \`column\`,
                (SELECT MAX(\`column\`) FROM column_agenda WHERE user_id = ?) as maxColumn
            FROM column_agenda
            WHERE id = ?
        `, [userId, columnAgendaId])
        if (!helperData.length) {
            throw new Error('Agenda column with that id not found')
        }
        const { column, maxColumn } = helperData[0]

        const hasDeleted = await conn.query(`DELETE from column_agenda WHERE id = ?`, [columnAgendaId])
        if (hasDeleted.affectedRows !== 1 || hasDeleted.warningStatus !== 0) {
            throw new Error('Failed to delete agenda column from DB')
        }

        if (column !== maxColumn) {
            await moveColumnsInRange(conn, column, maxColumn + 1, columnAgendaId, userId, '-')
        }
    })
}

