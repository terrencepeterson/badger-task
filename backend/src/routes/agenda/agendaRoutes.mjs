import { Router } from "express"
import { agendaColumnAccessControl } from "../../accessControl/attributeAccess.mjs"
import { getAgendaColumnEndpoint, getAgendaEndpoint, createAgendaColumnEndpoint, updateAgendaColumnEndpoint } from "./agendaController.mjs"
import { authenticate, validate } from "../../middleware.mjs"
import { createAgendaColumnSchema, getAgendaColumnSchema, updateAgendaColumnSchema } from "./agendaSchema.mjs"

const router = Router()
router.use(authenticate)

router.get('/column/:agendaColumnId', validate(getAgendaColumnSchema), agendaColumnAccessControl, getAgendaColumnEndpoint)
router.get('/', getAgendaEndpoint)
router.post('/column', validate(createAgendaColumnSchema), createAgendaColumnEndpoint)
router.put('/column/:agendaColumnId', validate(updateAgendaColumnSchema), agendaColumnAccessControl, updateAgendaColumnEndpoint)

export default router

