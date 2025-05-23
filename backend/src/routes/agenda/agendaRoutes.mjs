import { Router } from "express"
import { agendaColumnAccessControl } from "../../accessControl/attributeAccess.mjs"
import { getAgendaColumnEndpoint, getAgendaEndpoint, createAgendaColumnEndpoint } from "./agendaController.mjs"
import { authenticate } from "../../middleware.mjs"

const router = Router()
router.use(authenticate)

router.get('/column/:agendaColumnId', agendaColumnAccessControl, getAgendaColumnEndpoint)
router.get('/', getAgendaEndpoint)
router.post('/column', createAgendaColumnEndpoint)

export default router

