require("dotenv").config()
const express = require('express')
const app = express()
app.use(express.json())
const { server_host: host, server_port: port } = process.env

app.get('/', (req, res) => {
    res.json([
        { id: 1, name: 'bob', age: 26 },
        { id: 2, name: 'jason', age: 16 },
        { id: 3, name: 'susan', age: 36 }
    ])
})

app.listen(port, host, () => {
    console.log(`Example app listening on port ${port}`)
})

