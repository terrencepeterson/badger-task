import '@dotenvx/dotenvx/config'
import express from "express"
import cors from "cors"
import { responseFormatter, sanitiseInput } from './middleware.mjs'
import { signup } from './auth.mjs'

const app = express()
const { server_host: host, server_port: port } = process.env

app.use(express.json())
app.use(cors())
app.use(responseFormatter)
app.post('*', sanitiseInput)

app.get('/', (req, res) => {
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

app.listen(port, host, () => {
    console.log(`Example app listening on port`)
})

