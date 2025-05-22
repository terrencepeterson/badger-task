import '@dotenvx/dotenvx/config'
import { app } from "./app.mjs"
const { server_host: host, server_port: port } = process.env

app.listen(port, host, () => {
    console.log(`${host} listening on port ${port}`)
})

