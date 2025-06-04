import { Router } from "express"
import { agendaColumnAccessControl } from "../../accessControl/attributeAccess.mjs"
import { authenticate, validate } from "../../middleware.mjs"
import { createAgendaColumnSchema, deleteAgendaColumnSchema, getAgendaColumnSchema, updateAgendaColumnSchema } from "./agendaSchema.mjs"
import {
    getAgendaColumnEndpoint,
    getAgendaEndpoint,
    createAgendaColumnEndpoint,
    updateAgendaColumnEndpoint,
    deleteAgendaColumnEndpoint
} from "./agendaController.mjs"

const router = Router()
router.use(authenticate)

router.get('/column/:agendaColumnId', validate(getAgendaColumnSchema), agendaColumnAccessControl, getAgendaColumnEndpoint)
router.get('/', getAgendaEndpoint)
router.post('/column', validate(createAgendaColumnSchema), createAgendaColumnEndpoint)
router.patch('/column/:agendaColumnId', validate(updateAgendaColumnSchema), agendaColumnAccessControl, updateAgendaColumnEndpoint)
router.delete('/column/:agendaColumnId', validate(deleteAgendaColumnSchema), agendaColumnAccessControl, deleteAgendaColumnEndpoint)

export default router

