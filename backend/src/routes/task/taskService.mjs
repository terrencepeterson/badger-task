import { query, generateInsert, mapTags } from "../../db.mjs"
import { TASK_TABLE, CHECKLIST_TABLE, COMMENT_TABLE } from "../../definitions.mjs"

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
        FROM task tsk
        LEFT JOIN user u
            ON tsk.assignee = u.id
        LEFT JOIN column_project cp
            ON cp.id = tsk.project_column_id
        LEFT JOIN project p
            ON p.id = cp.project_id
        LEFT JOIN (
            SELECT tca.task_id, ca.name, ca.colour, ca.id
            FROM task_column_agenda tca
            INNER JOIN column_agenda ca
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
        FROM comment c
        LEFT JOIN user u
            ON u.id = c.created_by
        WHERE c.task_id = ?
    `, [taskId])
}

export function getTagsByTaskId(taskId) {
    return query(`
        SELECT t.id as tagId, t.name as tagName, t.colour as tagColour
        FROM tag t
        LEFT JOIN task_tag tt
            ON tt.tag_id = t.id
        WHERE tt.task_id = ?
    `, [taskId])
}

export function getChecklistByTaskId(taskId) {
    return query(`
        SELECT c.id as checklistId, c.name as checklistName, c.state as checklistState
        FROM checklist c
        WHERE c.task_id = ?
    `, [taskId])
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

export function createTask(name, description, due_date, project_row, created_by, assignee, project_column_id) {
    return generateInsert(TASK_TABLE, { name, description, due_date, project_row, created_by, assignee, project_column_id })
}

export async function getEditTaskHelperColumns({ taskId, userId, newProjectColumnId, newAgendaColumnId }) {
    const queryParams = [userId, taskId]

    if (newAgendaColumnId) {
        queryParams.unshift(newAgendaColumnId)
    }

    if (newProjectColumnId) {
        queryParams.unshift(newProjectColumnId)
    }

    const [details] = await query(`
        SELECT
            t.project_row AS currentProjectRow,
            t.project_column_id AS currentProjectColumnId,
            tca.row AS currentAgendaRow,
            tca.column_agenda_id  as currentAgendaColumnId,
            (SELECT MAX(project_row) FROM task WHERE project_column_id = t.project_column_id) AS maxRowCurrentProjectColumn,
            (SELECT MAX(row) FROM task_column_agenda tca2 WHERE tca2.column_agenda_id = tca.column_agenda_id ) AS maxRowCurrentAgendaColumn,
            ${newProjectColumnId ? '(SELECT MAX(project_row) FROM task WHERE project_column_id = ?) AS maxRowNewProjectColumn,' : ''}
            ${newAgendaColumnId ? '(SELECT MAX(row) FROM task_column_agenda tca2 WHERE tca2.column_agenda_id = ? ) AS maxRowNewAgendaColumn,' : ''}
            GROUP_CONCAT(DISTINCT cp.id ORDER BY cp.id SEPARATOR ',') AS validProjectColumnIds,
            GROUP_CONCAT(DISTINCT ca.id ORDER BY ca.id SEPARATOR ',') AS validAgendaColumnIds
        FROM task t
        LEFT JOIN column_agenda ca ON ca.user_id = ?
        JOIN column_project pc ON t.project_column_id = pc.id
        JOIN column_project cp ON cp.project_id = pc.project_id
        LEFT JOIN task_column_agenda tca ON tca.task_id = t.id
        WHERE t.id = ?
        GROUP BY t.id, t.project_row, t.project_column_id;
    `, queryParams)

    details.validProjectColumnIds = details.validProjectColumnIds.split(',').map(id => Number(id))
    details.validAgendaColumnIds = details.validAgendaColumnIds ? details.validAgendaColumnIds.split(',').map(id => Number(id)) : []
    details.maxRowCurrentProjectColumn++
    if (details.maxRowCurrentAgendaColumn) {
        details.maxRowCurrentAgendaColumn++
    }

    if (details.maxRowNewProjectColumn || details.maxRowNewProjectColumn === 0) {
        details.maxRowNewProjectColumn++
    } else if ((newProjectColumnId || newProjectColumnId === 0) && !details.maxRowNewProjectColumn) {
        details.maxRowNewProjectColumn = 0
    }

    if (details.maxRowNewAgendaColumn || details.maxRowNewAgendaColumn === 0) {
        details.maxRowNewAgendaColumn++
    } else if ((newAgendaColumnId || newAgendaColumnId === 0) && !details.maxRowNewAgendaColumn) {
        details.maxRowNewAgendaColumn = 0
    }

    return details
}

export function createChecklist(name, task_id) {
    return generateInsert(CHECKLIST_TABLE, {name, task_id})
}

export function createComment(text, task_id, created_by) {
    return generateInsert(COMMENT_TABLE, { text, task_id, created_by })
}

