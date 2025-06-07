import { z } from "zod/v4"
import sharp from "sharp"
import { generateUpdate, doIdsMatch, deleteRow, updateImgVersion  } from "./db.mjs"
import { idValidation } from "./validation.mjs"
import { getAllUsersFromOrganisationByUserId } from "./routes/user/userService.mjs"
import { removeMultipleAttributeAccess } from "./accessControl/attributeAccess.mjs"
import '@dotenvx/dotenvx/config'
import { unlink } from 'node:fs/promises'
import cloudinary from './cloudinary.mjs'
import {fileTypeFromFile} from 'file-type'
import { IMAGE_TYPES } from "./definitions.mjs"

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

export function createPatchEndpoint(validateAndFormatData, table, updateIdKey) {
    return createEndpoint(async (req) => {
        let { body: allowedData } = req
        const allowedDataKeys = Object.keys(allowedData)
        const updateId = req.params[updateIdKey]
        const successMessage = `Updated ${table}: ${allowedDataKeys.map(c => convertColumnToFrontName(c)).join(', ')}`

        if (!allowedDataKeys.length) {
            throw new Error('No data provided')
        }

        if (validateAndFormatData) { // for the more simple updates we don't need to format or validate or perform any direct inserts separately
            allowedData = await validateAndFormatData(allowedData, updateId, req.user.id, req)
        }

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

export function createDeleteEndpoint(table, idKey) {
    return createEndpoint(async (req) => {
        return await deleteRow(table, req.params[idKey])
    })
}

export function createDeleteWAccessControlEndpoint(deleteTable, deleteByParam, accessControlKey, name) {
    return createEndpoint(async (req) => {
        const hasDeletedRow = await deleteRow(deleteTable, req.params[deleteByParam])
        if (!hasDeletedRow) {
            throw new Error(`Failed to delete ${name}`)
        }

        const allUsersFromOrganisation = await getAllUsersFromOrganisationByUserId(req.user.id)
        await removeMultipleAttributeAccess(allUsersFromOrganisation, accessControlKey, req.params[deleteByParam])

        return `Successfully deleted ${name}`
    })
}

export function createImageEndpoint(table, paramIdKey, imageType) {
    return createEndpoint(async (req) => {
        const { path } = req.file
        const resourceId = req.params[paramIdKey]
        const imagePublicKey = generateImagePublicKey(table, resourceId, imageType)
        const convertedImagePath = `${process.env.backend_root}/uploads/${imagePublicKey}.webp`
        if (!resourceId && resourceId !== 0 || !table || !imageType) {
            throw new Error('Failed to add image to the databasae')
        }

        const fileType = await fileTypeFromFile(path)
        if (!IMAGE_TYPES.includes(fileType.ext)) {
            throw new Error('Invalid file type')
        }

        await sharp(path)
            .resize(1000, null, { withoutEnlargement: true })
            .webp()
            .toFile(convertedImagePath)

        const res = await cloudinary.uploader.upload(convertedImagePath, {
            public_id: imagePublicKey,
            resource_type: 'auto'
        })
        if (!res.version) {
            throw new Error('Failed to update image')
        }

        try {
            await unlink(convertedImagePath)
            await unlink(path)
        } catch (e) {
            throw new Error('Failed to delete temporary file')
        }

        const hasUpdatedImage = await updateImgVersion(table, res.version, resourceId, imageType)
        if (!hasUpdatedImage) {
            throw new Error('Failed to add image to the databasae')
        }

        return { message:  "Successfully uploaded image", data: generateImageLink({ publicId: imagePublicKey, version: res.version }) }
    })
}

export function jsDateToSqlDate(dateTimeIsoString) {
    const datetime = new Date(dateTimeIsoString)
    if (!datetime) {
        return null
    }
    return datetime.toISOString().replace(/T|Z/g, ' ').trim()
}

export function dateIsInFuture(dateTimeIsoString) {
    const now = new Date()
    const testDate = new Date(dateTimeIsoString)
    if (!testDate) {
        throw new Error('Invalid date config object provided')
    }
    return testDate.getTime() > now.getTime()
}

function convertColumnToFrontName(column) {
    const firstLetter = column.charAt(0).toUpperCase()
    return firstLetter + column.replaceAll('_', ' ').substring(1)
}

export function createIdSchema(paramNames) {
    if (!Array.isArray(paramNames)) {
        paramNames = [paramNames]
    }

    const zConfigObject = Object.fromEntries(paramNames.map(paramName => [paramName, idValidation]))
    return z.object(zConfigObject)
}

export function createValidateParamIds(table, childIdParamName, parentIdColumnName, parentIdParamName) {
    return async function(ctx) {
        if (!await doIdsMatch(table, ctx.value[childIdParamName], parentIdColumnName, ctx.value[parentIdParamName])) {
            ctx.issues.push({
                code: 'custom',
                message: `Invalid ${childIdParamName} or ${parentIdParamName} - make sure they\'re correct`,
                input: ctx.value,
                path: [`${childIdParamName} & ${parentIdParamName}`]
            })
        }
    }
}

export function generateImagePublicKey(dbTableName, resourceId, imageType) {
    return `${dbTableName}_${resourceId}_${imageType}`
}

export function generateImageLink(config) {
    const { publicId, version } = config
    if (!publicId) {
        return false
    }
    const baseUrl = `https://res.cloudinary.com/${process.env.cloudinary_cloud_name}/image/upload/q_auto/f_auto/`
    const segments = []

    if (version) {
        segments.push(`v${config.version}`)
    }
    segments.push(publicId)
    let path = segments.join('/')

    return baseUrl + path
}

export function convertDbImgToUrl(resource, imgKey, imgType, defaultImgLink, table, resourceId) {
    resource = { ...resource }
    const dbImgKey = `${imgKey}_img_version`
    const resourceImgKey = `${imgKey}_img_url`
    if (resource[dbImgKey]) {
        resource[resourceImgKey] = generateImageLink({ publicId: generateImagePublicKey(table, resourceId, imgType), version: resource[dbImgKey]})
    } else {
        resource[resourceImgKey] = defaultImgLink
    }
    delete resource[dbImgKey]
    return resource
}

