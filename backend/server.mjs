import '@dotenvx/dotenvx/config'
import express from "express"
import cors from "cors"
import { responseFormatter, sanitiseInput } from './middleware.mjs'
import { signup, login } from './auth.mjs'

const app = express()
const { server_host: host, server_port: port } = process.env

const corsOptions = {
    origin: 'http://127.0.0.1:5500',
    credentials: true
}

app.use(express.json())
app.use(cors(corsOptions))
app.use(responseFormatter)
app.post('*', sanitiseInput)

app.get('/', async (req, res) => {
    const authToken = await req.getAuthToken()

    if (!authToken) {
        res.error('Access denied, please login', 401, { redirect: true, url: "/login"})
        return
    }

    res.json([
        { id: 1, name: 'bob', age: 26 },
        { id: 2, name: 'jason', age: 16 },
        { id: 3, name: 'susan', age: 36 }
    ])
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

app.listen(port, host, () => {
    console.log(`Example app listening on port`)
})

