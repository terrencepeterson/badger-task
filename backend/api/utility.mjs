import { DEFAULT_DB_VALUE } from "./definitions.mjs"
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
                res.success(successMessage, data)
                return
            }

            res.success(data)
        } catch (e) {
            console.log(e)
            res.error(e.message)
        }
    }
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
    if (!dateConfig) {
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
