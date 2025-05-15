import '@dotenvx/dotenvx/config'
import { getAgendaColumns, getProjectsAccess, getTaskAccess } from "../db/db.mjs"
import { createClient } from 'redis';
import {
    ACCESS_CONTROL_COLUMN_AGENDA,
    ACCESS_CONTROL_TASKS,
    ACCESS_CONTROL_PROJECTS,
    ACCESS_CONTROL_COLUMN_PROJECTS
} from './definitions.mjs'

const redisClient = await createClient({
    url: `redis://default:${process.env.cache_pass}@cache:${process.env.cache_port}`
})
    .on('error', err => console.log('Redis Client Error', err))
    .connect()

export const taskAccessControl = createAccessControlMiddleware('taskId', ACCESS_CONTROL_TASKS, 'task')
export const projectAccessControl = createAccessControlMiddleware('projectId', ACCESS_CONTROL_PROJECTS, 'project')
export const agendaColumnAccessControl = createAccessControlMiddleware('column', ACCESS_CONTROL_COLUMN_AGENDA, 'agenda column')
export const projectColumnAccessControl = createAccessControlMiddleware('column', ACCESS_CONTROL_COLUMN_PROJECTS, 'project column')

export async function removeAccessControl(userId) {
    const keys = [
        getRedisKey(userId, ACCESS_CONTROL_TASKS),
        getRedisKey(userId, ACCESS_CONTROL_PROJECTS),
        getRedisKey(userId, ACCESS_CONTROL_COLUMN_PROJECTS),
        getRedisKey(userId, ACCESS_CONTROL_COLUMN_AGENDA)
    ]

    // if user doesn't have any values for a set then it doesn't get added to redis
    const activeKeys = []
    for (const key of keys) {
        const exists = await redisClient.exists(key)
        if (exists) {
            activeKeys.push(key)
        }
    }

    const hasDeleted = await redisClient.del(activeKeys)
    if (!hasDeleted) {
        throw new Error('Failed to delete redis keys')
    }

    return hasDeleted
}

export async function addAccessControls(userId) {
    if (!userId && userId !== 0) { // checks for undefined as well
        throw new Error('Unauthorised - please login')
    }

    const expirationTime = process.env.auth_session_seconds
    const addSet = async (userId, attributeType, accessData, expireTime) => {
        // if a user doesn't belong to an organisation empty data can be passed in here
        // can't store empty so we don't add it to redis at all
        if (!accessData.length) {
            return true
        }
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

export async function getIsValidAssignee(assignee, projectColumnId) {
    let isValidAssignee
    const assigneeProjectColumnExistsInCache = await doesExistInCache(assignee, ACCESS_CONTROL_COLUMN_PROJECTS)

    if (assigneeProjectColumnExistsInCache) {
        isValidAssignee = await getCanAccess(assignee, ACCESS_CONTROL_COLUMN_PROJECTS, projectColumnId)
    } else {
        const assigneeProjectAccessControl = await getProjectsAccess(assignee)
        isValidAssignee = assigneeProjectAccessControl?.columnProjects.includes(projectColumnId)
    }

    return isValidAssignee
}

function createAccessControlMiddleware(attributeKey, accessControlKey, errorAttributeType) {
    return async function(req, res, next) {
        const attribute = req.query[attributeKey]
        if (!attribute && attribute !== 0) {
            res.error(`Please provide a ${attributeKey}`)
            return
        }

        const canAccess = await getCanAccess(req.user.id, accessControlKey, attribute)
        if (!canAccess) {
            res.error(`Unauthorised - you don\'t have permision to access this ${errorAttributeType}`, 403)
            return
        }

        next()
    }
}

export async function addAttributeAccess(userId, accessControlKey, attribute) {
    const redisKey = getRedisKey(userId, accessControlKey)
    const hasAddedAttribute = await redisClient.sAdd(redisKey, attribute)
    if (!hasAddedAttribute) {
        throw new Error(`Failed to update ${accessControlKey} access controls`)
    }

    return true
}

export async function addMultipleAttributeAccess(userIds, accessControlKey, attributes) {
    const redisKeys = userIds.map(id => getRedisKey(id, accessControlKey))
    for (const [i, redisKey] of redisKeys.entries()) {
        const keyExists = await redisClient.exists(redisKey)
        if (!keyExists) {
            continue
        }

        const attribute = Array.isArray(attributes) ? attributes[i] : attributes
        const hasAddedAttribute = await redisClient.sAdd(redisKey, attribute.toString())
        if (!hasAddedAttribute) {
            throw new Error(`Failed to update ${redisKey}: ${attribute}`)
        }
    }
}

export function getCanAccess(userId, accessControlKey, attribute) {
    const redisKey = getRedisKey(userId, accessControlKey)
    return redisClient.sIsMember(redisKey, attribute)
}

function doesExistInCache(userId, accessControlKey) {
    const redisKey = getRedisKey(userId, accessControlKey)
    return redisClient.exists(redisKey)
}

function getRedisKey(userId, attributeType) {
    return `user:${userId}:${attributeType}`
}

