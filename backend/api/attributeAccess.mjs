import '@dotenvx/dotenvx/config'
import { getAgendaColumns, getProjectsAccess, getTaskAccess } from "../db.mjs"
import { createClient } from 'redis';
export const ACCESS_CONTROL_COLUMN_AGENDA = 'columnAgenda'
export const ACCESS_CONTROL_TASKS = 'tasks'
export const ACCESS_CONTROL_PROJECTS = 'projects'
export const ACCESS_CONTROL_COLUMN_PROJECTS = 'columnProjects'

const redisClient = await createClient({
    url: `redis://default:${process.env.cache_pass}@cache:${process.env.cache_port}`
})
    .on('error', err => console.log('Redis Client Error', err))
    .connect()

function getRedisKey(userId, attributeType) {
    return `user:${userId}:${attributeType}`
}

export async function removeAccessControl(userId) {
    const keys = [
        getRedisKey(userId, ACCESS_CONTROL_TASKS),
        getRedisKey(userId, ACCESS_CONTROL_PROJECTS),
        getRedisKey(userId, ACCESS_CONTROL_COLUMN_PROJECTS),
        getRedisKey(userId, ACCESS_CONTROL_COLUMN_AGENDA)
    ]

    const hasDeleted = await redisClient.del(keys)
    if (!hasDeleted) {
        throw new Error('Failed to delete redis keys')
    }

    return hasDeleted
}

export async function addAccessControl(userId) {
    if (userId == null) { // checks for undefined as well

    }

    const expirationTime = process.env.auth_session_seconds
    const addSet = async (userId, attributeType, accessData, expireTime) => {
        const redisKey = getRedisKey(userId, attributeType)
        const importMulti = redisClient.multi()
        importMulti.sAdd(redisKey, accessData)
        importMulti.expire(redisKey, expireTime)
        const [ rowsAffected, success ] = await importMulti.exec()
        return success
    }

    const tasks = await getTaskAccess(userId)
    const projectsAndProjectColumns = await getProjectsAccess(userId)
    let agendaColumns = await getAgendaColumns(userId)
    agendaColumns = agendaColumns.map(ac => `${ac.id}`) // must convert ot string for redis!

    if (!await addSet(userId, ACCESS_CONTROL_TASKS, tasks, expirationTime) ||
        !await addSet(userId,  ACCESS_CONTROL_PROJECTS, projectsAndProjectColumns.projects, expirationTime) ||
        !await addSet(userId, ACCESS_CONTROL_COLUMN_PROJECTS, projectsAndProjectColumns.columnProjects, expirationTime) ||
        !await addSet(userId, ACCESS_CONTROL_COLUMN_AGENDA, agendaColumns, expirationTime)
    ) {
        throw new Error('Failed to add access control')
    }
}

function createAccessControlMiddleware(attributeKey, accessControlKey, errorMessage) {
    return async function(req, res, next) {
        const attribute = req.query[attributeKey] 
        if (attribute === undefined || attribute === null || attribute === "") {
            res.error(`Please provide a ${attributeKey}`)
            return
        }

        const redisKey = getRedisKey(req.user.id, accessControlKey)

        const canAccess = await redisClient.sIsMember(redisKey, attribute)
        if (!canAccess) {
            res.error(errorMessage, 403)
            return
        }

        next()
    }
}

export const taskAccessControl = createAccessControlMiddleware('taskId', ACCESS_CONTROL_TASKS, 'Unauthorised - you don\'t have permision to access this task')

