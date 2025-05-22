import express from "express"
import cors from "cors"
import { responseFormatter, sanitiseInput, authenticate } from "./middleware.mjs"

import organisationRouter from './routes/organisation/organisationRoutes.mjs'
import authRouter from './routes/auth/authRoutes.mjs'
import projectRouter from './routes/project/projectRoutes.mjs'
import taskRouter from './routes/task/taskRoutes.mjs'
import userRouter from './routes/user/userRoutes.mjs'
import agendaRouter from './routes/agenda/agendaRoutes.mjs'

const app = express()
const corsOptions = {
    origin: true,
    credentials: true
}

app.use(express.json())
app.use(cors(corsOptions))
app.use(responseFormatter)
app.post('*', sanitiseInput)
app.get('*', authenticate)
app.put('*',  sanitiseInput, authenticate)

app.use('/organisation', organisationRouter)
app.use('/auth', authRouter)
app.use('/project', projectRouter)
app.use('/task', taskRouter)
app.use('/user', userRouter)
app.use('/agenda', agendaRouter)

export { app }

