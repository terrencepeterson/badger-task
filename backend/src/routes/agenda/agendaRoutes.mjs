import { Router } from "express"
import { agendaColumnAccessControl } from "../../accessControl/attributeAccess.mjs"
import { getAgendaColumnEndpoint, getAgendaEndpoint, createAgendaColumnEndpoint } from "./agendaController.mjs"
import { authenticate } from "../../middleware.mjs"

const router = Router()

router.get('/column', agendaColumnAccessControl, getAgendaColumnEndpoint)
router.get('/', getAgendaEndpoint)
router.post('/column', authenticate, createAgendaColumnEndpoint)

export default router

