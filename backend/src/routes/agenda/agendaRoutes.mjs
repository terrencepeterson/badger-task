import { Router } from "express"
import { agendaColumnAccessControl } from "../../accessControl/attributeAccess.mjs"
import { getAgendaColumnEndpoint, getAgendaEndpoint, createAgendaColumnEndpoint } from "./agendaController.mjs"
import { authenticate, validate } from "../../middleware.mjs"
import { createAgendaColumnSchema, getAgendaColumnSchema } from "./agendaSchema.mjs"

const router = Router()
router.use(authenticate)

router.get('/column/:agendaColumnId', validate(getAgendaColumnSchema), agendaColumnAccessControl, getAgendaColumnEndpoint)
router.get('/', getAgendaEndpoint)
router.post('/column', validate(createAgendaColumnSchema), createAgendaColumnEndpoint)

export default router

