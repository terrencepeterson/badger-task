import { query, generateInsert, mapTags, transactionQuery } from "../../db.mjs"
import { TASK_TABLE, CHECKLIST_TABLE, COMMENT_TABLE, AVATAR_IMAGE_TYPE, USER_TABLE, TASK_TAG_TABLE } from "../../definitions.mjs"
import '@dotenvx/dotenvx/config'
import { convertDbImgToUrl } from "../../utility.mjs"
import { defaultUserAvatarLink } from "../../cloudinary.mjs"

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
    let task = await query(`
        SELECT
            tsk.id as taskId,
            tsk.name,
            tsk.description,
            tsk.due_date,
            tsk.state,
            tsk.created_at,
            u.name as assigneeName,
            u.avatar_img_version,
            u.id as userId,
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

    if (!task.length) {
        return null
    }

    task = convertDbImgToUrl(task[0], AVATAR_IMAGE_TYPE, AVATAR_IMAGE_TYPE, defaultUserAvatarLink, USER_TABLE, task[0].userId)
    delete task.userId

    return task
}

export async function getCommentsByTaskId(taskId) {
    let comments = await query(`
        SELECT
            c.id as commentId,
            c.text as comment,
            c.created_at as commentCreatedAt,
            u.name as commentCreatedBy,
            u.avatar_img_version,
            u.id as userId
        FROM comment c
        LEFT JOIN user u
            ON u.id = c.created_by
        WHERE c.task_id = ?
    `, [taskId])

    comments = comments.map(c => {
        const userId = c.userId
        delete c.userId
        return convertDbImgToUrl(c, AVATAR_IMAGE_TYPE, AVATAR_IMAGE_TYPE, defaultUserAvatarLink, USER_TABLE, userId)
    })

    return comments
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

export async function getIsValidTasksProjectColumn(taskIds, projectColumnId) {
    let allTasksFromProjectColumn = await query(`
        SELECT id FROM task WHERE project_column_id = ? ORDER BY id ASC;
    `, [projectColumnId])
    allTasksFromProjectColumn = allTasksFromProjectColumn.map(taskId => taskId.id)
    const sortedTasks = taskIds.sort((a, b) => a - b)

    if (allTasksFromProjectColumn.length !== sortedTasks.length) {
        return false
    }

    for (let i = 0; i < sortedTasks.length; ++i) {
        if (sortedTasks[i] !== allTasksFromProjectColumn[i]) {
            return false
        }
    }

    return true
}

export async function updateTasksProjectColumn(currentProjectColumnId, newProjectColumnId, taskIds) {
    const taskPlaceholders = taskIds.map(id => '?').join(',')
    // already checked that the tasks from the same project column
    const isNewProjectColumnInSameProject = await query(`
        SELECT id
        FROM column_project
        WHERE id = ? AND project_id = (SELECT project_id FROM column_project WHERE id = ?)
    `, [newProjectColumnId, currentProjectColumnId])
    if (isNewProjectColumnInSameProject.length !== 1) {
        throw new Error('Invalid projectColumnId - the new project column is invalid, you can only move tasks to columns inside the same project')
    }

    transactionQuery(async (conn) => {
        let lengthNewColumn = await conn.query(`
            SELECT MAX(project_row) + 1 as columnLength FROM task WHERE project_column_id = ?;
        `, [newProjectColumnId])
        lengthNewColumn = lengthNewColumn[0].columnLength
        lengthNewColumn = Number(lengthNewColumn ?? 0)

        await conn.query(`
            UPDATE task
            SET project_row = project_row + ?
            WHERE id IN (${taskPlaceholders});
        `, [lengthNewColumn, ...taskIds])

        await conn.query(`
            UPDATE task
            SET project_column_id = ?
            WHERE id IN (${taskPlaceholders});
        `, [newProjectColumnId, ...taskIds])
    })
}

export async function isValidTag(tagId, taskId) {
    const isValid = await query(`
        SELECT id FROM tag WHERE id = ? AND project_id = (
            SELECT p.id
            FROM task t
            INNER JOIN column_project cp
            ON cp.id = t.project_column_id
            INNER JOIN project p
            ON p.id = cp.project_id
            WHERE t.id = ?
        )
    `, [tagId, taskId])
    return !!isValid.length
}

// notice IGNORE here - seen as though we're using a composite key in
// this table if a duplicate is added it crashes the server
export async function addTagToTask(tagId, taskId) {
    let addedTag = await query(`
        INSERT IGNORE INTO task_tag (tag_id, task_id)
        VALUES (?, ?);
    `, [tagId, taskId])

    if (addedTag.affectedRows === 0 && addedTag.warningStatus >= 1) {
        throw new Error('Duplicated tag on task')
    }

    return true
}

