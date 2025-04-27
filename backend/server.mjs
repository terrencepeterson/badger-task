import '@dotenvx/dotenvx/config'
import express from "express"
import cors from "cors"
import { responseFormatter, sanitiseInput, authenticate } from './middleware.mjs'
import { signupEndpoint, loginEndpoint, logoutEndpoint } from './api/auth.mjs'
import {
    agendaEndpoint,
    agendaColumnEndpoint,
    projectColumnEndpoint,
    projectEndpoint,
    taskEndpoint,
    dashboardEndpoint
} from './api/get.mjs'
import { taskAccessControl, projectAccessControl } from './api/attributeAccess.mjs'

const app = express()
const { server_host: host, server_port: port } = process.env

const corsOptions = {
    origin: true,
    credentials: true
}

app.use(express.json())
app.use(cors(corsOptions))
app.use(responseFormatter)
app.post('*', sanitiseInput)

app.get('/agenda-column', authenticate, agendaColumnEndpoint)
app.get('/agenda', authenticate, agendaEndpoint)
app.get('/project-column', authenticate, projectColumnEndpoint)
app.get('/project', authenticate, projectAccessControl, projectEndpoint)
app.get('/task', authenticate, taskAccessControl, taskEndpoint)
app.get('/dashboard', authenticate, dashboardEndpoint)

app.post('/sign-up', signupEndpoint)
app.post('/login', loginEndpoint)
app.get('/logout', authenticate, logoutEndpoint)

app.listen(port, host, () => {
    console.log(`${host} listening on port ${port}`)
})

