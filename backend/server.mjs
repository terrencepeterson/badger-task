import '@dotenvx/dotenvx/config'
import express from "express"
import cors from "cors"
import { responseFormatter, sanitiseInput } from './middleware.mjs'

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

app.post('/sign-up', (req, res) => {
    console.log('test post')
    console.log(req.body)
    res.send(req.body)
})

app.listen(port, host, () => {
    console.log(`Example app listening on port`)
})

