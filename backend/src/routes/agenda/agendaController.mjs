import { createEndpoint, createPutEndpoint } from "../../utility.mjs"
import { addAttributeAccess } from "../../accessControl/attributeAccess.mjs"
import { ACCESS_CONTROL_COLUMN_AGENDA, COLUMN_AGENDA_TABLE } from "../../definitions.mjs"
import { getColumnByAgendaColumnId, moveAgendaColumn } from "./agendaService.mjs"

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
        let currentColumn = await getColumnByAgendaColumnId(columnAgendaId)

        if (!currentColumn && currentColumn !== 0) {
            throw new Error('Unable to update agenda column')
        }

        if (currentColumn === newColumn) {
            throw new Error('Please provide a new value for column')
        }

        if (newColumn < currentColumn) {
            await moveAgendaColumn(columnAgendaId, newColumn, newColumn - 1, currentColumn, '+', userId)
        } else {
            await moveAgendaColumn(columnAgendaId, newColumn, currentColumn, newColumn + 1, '-', userId)
        }

        delete allowedData.column
    }

    return allowedData
}

