import '@dotenvx/dotenvx/config'
import express from "express"
import cors from "cors"
import { responseFormatter, sanitiseInput, authenticate } from './middleware.mjs'
import { signup, login } from './auth.mjs'
import { loggedOut } from './standarisedResponses.mjs'
import { dashboard, task } from './api.mjs'

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

app.get('/task', authenticate, async(req, res) => {
    try {
        const { taskId } = req.query
        const data = await task(taskId)
        res.success(data)
    } catch(e) {
        console.log(e)
        res.error(e.message)
    }
})

app.get('/dashboard', authenticate, async (req, res) => {
    try {
        const { lastTaskId } = req.query
        const data = await dashboard(req.user.id, +lastTaskId)
        res.success(data)
    } catch (e) {
        res.error(e.message)
    }
})

app.post('/sign-up', async (req, res) => {
    try {
        const data = await signup(req.body)
        res.success(data)
    } catch (e) {
        console.error(e)
        res.error(e.message)
    }
})

app.post('/login', async (req, res) => {
    try {
        const token = await login(req.body)
        res.setTokenCookie(token)
        res.success('Successfully logged in!')
    } catch (e) {
        console.error(e)
        res.error(e.message)
    }
})

app.get('/logout', authenticate, async (req, res) => {
    try {
        res.clearCookie(process.env.auth_token_cookie_name)
        res.success(loggedOut.message, loggedOut.metaData)
    } catch (e) {
        console.error(e)
        res.error(e.message)
    }
})

app.listen(port, host, () => {
    console.log(`Example app listening on port`)
})

