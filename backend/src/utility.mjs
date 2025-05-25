import { z } from "zod/v4"
import { DEFAULT_DB_VALUE } from "./definitions.mjs"
import { generateUpdate } from "./db.mjs"
// creates an async wrapper around an endpoint
// instead of having the below in all endpoints
//try {
//    do whatever the endpoint needs to do
//    res.success(data)
//} catch (e) {
//    console.log(e)
//    res.error(e.message)
//}
export function createEndpoint(getData, checkUser = true) {
    return async (req, res) => {
        try {
            if (checkUser && !req.user.id && req.user.id !== 0) {
                throw new Error('Unauthenticated - please login')
            }

            const data = await getData(req, res)
            if (typeof data === 'object') {
                const successMessage = data.message
                delete data.message
                return res.success(successMessage, data)
            }

            return res.success(data)
        } catch (e) {
            console.log(e)
            return res.error(e.message)
        }
    }
}

export function createPutEndpoint(validateAndFormatData, allowedColumnKeys, table, updateIdKey) {
    return createEndpoint(async (req) => {
        let allowedData = Object.fromEntries(
            Object.entries(req.body).
            filter(([columnName, val]) => allowedColumnKeys.includes(columnName))
        )
        const allowedDataKeys = Object.keys(allowedData)
        const updateId = req.params[updateIdKey]
        const successMessage = `Updated ${table}: ${allowedDataKeys.map(c => convertColumnToFrontName(c)).join(', ')}`

        if (!allowedDataKeys.length) {
            throw new Error('No data provided')
        }

        allowedData = await validateAndFormatData(allowedData, updateId, req.user.id)
        if (!Object.keys(allowedData).length) {
            // sometimes we perform the changes in the validateAndFormat - say for the custom move rows stuff
            return successMessage
        }

        const data = await generateUpdate(table, allowedData, 'id', updateId)
        if (!data) {
            throw new Error(`Failed to update ${convertColumnToFrontName(table)}`)
        }

        return successMessage
    })
}

export function formatNullableInput(input) {
    return (!input && input !== 0) ? null : input
}

export function formatDefaultableInput(input) {
    return (!input && input !== 0) ? DEFAULT_DB_VALUE : input
}

// new Date(year,month,day,hour,minutes)
// months are zero based in the Date
// expect config { year, month, day, hours, minutes }
export function jsDateToSqlDate(dateConfig) {
    const datetime = createDateObject(dateConfig)
    if (!datetime) {
        return null
    }
    return datetime.toISOString().replace(/T|Z/g, ' ').trim()
}

export function dateIsInFuture(dateConfig) {
    const now = new Date()
    const testDate = createDateObject(dateConfig)
    if (!testDate) {
        throw new Error('Invalid date config object provided')
    }
    return testDate.getTime() > now.getTime()
}

function createDateObject(dateConfig) {
    if (!dateConfig || typeof dateConfig !== 'object') {
        return null
    }

    for (const key in dateConfig) {
        dateConfig[key] = parseInt(dateConfig[key])
    }

    let { year, month, day, hour, minute } = dateConfig
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return null
    }

    if (!hour && hour !== 0) {
        hour = minute = null
    }

    if (!isNaN(hour) && !minute && minute !== 0) { // is an hour is provided must also provide a minute value
        minute = 0
    }

    return new Date(year, month, day, hour, minute)
}

function convertColumnToFrontName(column) {
    const firstLetter = column.charAt(0).toUpperCase()
    return firstLetter + column.replaceAll('_', ' ').substring(1)
}

export function createIdSchema(paramNames) {
    if (!Array.isArray(paramNames)) {
        paramNames = [paramNames]
    }

    const zConfigObject = Object.fromEntries(paramNames.map(paramName => [paramName, z.coerce.number().int().min(0)]))
    return z.object(zConfigObject)
}

