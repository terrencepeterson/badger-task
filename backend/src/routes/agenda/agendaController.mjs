import { createEndpoint, createPutEndpoint } from "../../utility.mjs"
import { addAttributeAccess, removeMultipleAttributeAccess } from "../../accessControl/attributeAccess.mjs"
import { ACCESS_CONTROL_COLUMN_AGENDA, COLUMN_AGENDA_TABLE } from "../../definitions.mjs"
import { deleteAgendaColumn, getMoveAgendaColumHelperData } from "./agendaService.mjs"

import {
    getAgendaTags,
    getAgendaTasks,
    getAgendaColumns,
    getAgendaUsers,
    getAgendaProjects,
    getAgendaColumn,
    createAgendaColumn,
    getAgendaColumnColumns
} from "./agendaService.mjs"
import { moveColumn } from "../../db.mjs"

export const getAgendaEndpoint = createEndpoint(async (req) => {
    const { id: userId } = req.user

    const agenda = {}

    agenda.tasks = await getAgendaTasks(userId)
    agenda.columns = await getAgendaColumns(userId)
    agenda.users = await getAgendaUsers(userId)
    agenda.tags = await getAgendaTags(userId)
    agenda.projects = await getAgendaProjects(userId)

    return agenda
})

export const getAgendaColumnEndpoint = createEndpoint((req) => {
    const { agendaColumnId: column } = req.params
    const { row } = req.query

    if (!column && column !== 0) {
        throw new Error('No column provide')
    }

    if (!row && row !== 0) {
        throw new Error('No row provided')
    }

    return getAgendaColumn(column, row)
})

export const createAgendaColumnEndpoint = createEndpoint(async (req) => {
    const { id: userId } = req.user
    const currentColumns = await getAgendaColumnColumns(userId)
    const column = currentColumns.length ? ++currentColumns[0] : 0 // currentColumns always returns with highest column first

    const agendaColumnId = await createAgendaColumn(req.body.name, req.body.colour, column, userId)
    if (!agendaColumnId && agendaColumnId !== 0) {
        throw new Error('Failed to create agenda column')
    }

    await addAttributeAccess(userId, ACCESS_CONTROL_COLUMN_AGENDA, agendaColumnId.toString())

    return { message: 'Successfully created agenda column', agendaColumnId }
})

export const updateAgendaColumnEndpoint = createPutEndpoint(
    updateAgendaColumnFormat,
    ['name', 'colour', 'column'],
    COLUMN_AGENDA_TABLE,
    'agendaColumnId'
)

async function updateAgendaColumnFormat(allowedData, columnAgendaId, userId) {
    const { column: newColumn } = allowedData

    if (Object.hasOwn(allowedData, 'column')) {
        let { currentColumn, maxColumn } = await getMoveAgendaColumHelperData(userId, columnAgendaId)

        if (!currentColumn && currentColumn !== 0) {
            throw new Error('Unable to update agenda column')
        }

        if (newColumn > maxColumn) {
            throw new Error(`New column is out of range (0 - ${maxColumn}) - please provide a column within the given range`)
        }

        if (currentColumn === newColumn) {
            throw new Error('Please provide a new value for column')
        }

        if (newColumn < currentColumn) {
            await moveColumn(columnAgendaId, newColumn, newColumn - 1, currentColumn, '+', userId, COLUMN_AGENDA_TABLE)
        } else {
            await moveColumn(columnAgendaId, newColumn, currentColumn, newColumn + 1, '-', userId, COLUMN_AGENDA_TABLE)
        }

        delete allowedData.column
    }

    return allowedData
}

// export const deleteAgendaColumnEndpoint = createDeleteEndpoint(COLUMN_AGENDA_TABLE, 'agendaColumnId')
export const deleteAgendaColumnEndpoint = createEndpoint(async (req) => {
    const { id: userId } = req.user
    const { agendaColumnId } = req.params
    await deleteAgendaColumn(userId, agendaColumnId)
    await removeMultipleAttributeAccess([userId], ACCESS_CONTROL_COLUMN_AGENDA, agendaColumnId)

    return 'Successfully deleted agenda column'
})

