export const RECENT_PROJECT_KEY = 'recent_projects'
const LOCAL_STORAGE_NAME = 'badgerTask'
import { useUserStore } from '@/stores/UserStore'

export function addRecentlyViewedProject(projectId) {
    const userStore = useUserStore()
    const locallyStoredConfig = getLocalStorage()
    let recentProjects = []
    if (Object.hasOwn(locallyStoredConfig, RECENT_PROJECT_KEY)) {
        recentProjects = locallyStoredConfig[RECENT_PROJECT_KEY]
    }

    // if the projectId already exists in recent swap it the front
    // if not and the length is 4 remove the oldest item
    const projectIdIndex = recentProjects.indexOf(projectId)
    if (projectIdIndex > -1) {
        recentProjects.splice(projectIdIndex, 1)
    } else if (recentProjects.length > 3) {
        recentProjects.pop()
    }
    recentProjects.unshift(projectId)
    locallyStoredConfig[RECENT_PROJECT_KEY] = recentProjects
    // Update global storage too
    userStore.updateRecentlyViewedProjects(recentProjects)
    localStorage.setItem(LOCAL_STORAGE_NAME, JSON.stringify(locallyStoredConfig))
}

export function getRecentViewedProjects() {
    const locallyStoredConfig = getLocalStorage()
    return locallyStoredConfig[RECENT_PROJECT_KEY] ?? []
}

function getLocalStorage() {
    const locallyStoredConfig = localStorage.getItem(LOCAL_STORAGE_NAME)
    if (!locallyStoredConfig) {
        localStorage.setItem(LOCAL_STORAGE_NAME, JSON.stringify({}))
        return {}
    }

    return JSON.parse(locallyStoredConfig)
}

