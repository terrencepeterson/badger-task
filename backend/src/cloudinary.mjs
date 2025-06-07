import '@dotenvx/dotenvx/config'
import { v2 as cloudinary } from 'cloudinary'
const { cloudinary_cloud_name: cloudinaryName, cloudinary_api_key: cloudinaryKey, cloudinary_api_secret: cloudinarySecret } = process.env
import { generateImageLink } from './utility.mjs'

cloudinary.config({
    cloud_name: cloudinaryName,
    api_key: cloudinaryKey,
    api_secret: cloudinarySecret
})

export const defaultOrganisationAvatarLink = generateImageLink({ publicId: 'default_organisation_avatar' })
export const defaultBackgroundLink = generateImageLink({ publicId: 'default_background_image' })
export const defaultUserAvatarLink = generateImageLink({ publicId: 'default_user_avatar' })
export const defaultProjectAvatarLink = generateImageLink({ publicId: 'default_project_avatar' })

export default cloudinary

