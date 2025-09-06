import { getRecentViewedProjects } from "@/localStorage"
import { defineStore } from "pinia"

export const useUserStore = defineStore('UserStore', {
    state: () => ({
        isLoggedIn: false,
        id: null,
        name: '',
        avatarImgUrl: '',
        description: '',
        email: '',
        hasInit: false,
        organisationId: null,
        organisationImgUrl: '',
        projects: [],
        recentProjects: []
    }),
    actions: {
        setUser(config) {
            const keys = Object.keys(config)
            keys.forEach(key => {
                if (Object.hasOwn(this, key)) {
                    this[key] = config[key]
                }
            })

            if (this.id || this.id === 0) {
                this.isLoggedIn = true
            }

            this.recentProjects = getRecentViewedProjects()
        },
        async initUser() {
            // first time a user accesses a page we check to see if they have an active JWT
            if (this.hasInit) {
                return true
            }

            this.hasInit = true
            try {
                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/user`, {
                    credentials: 'include'
                })
                const parsedData = await res.json()
                if (res.status < 200 || res.status > 299) {
                    throw new Error(parsedData.error.message ?? 'Internal server error')
                }
                this.setUser(parsedData.data)
            } catch(e) {
                console.log(e.message)
                // means the user isn't logged in which is ok
            }
        },
        updateRecentlyViewedProjects(newRecentProjects) {
            this.recentProjects = newRecentProjects
        },
        reset() {
            this.isLoggedIn = false
            this.id = null
            this.name = ''
            this.avatarImgUrl = ''
            this.description = ''
            this.email = ''
            this.organisationId = null
            this.organisationImgUrl = ''
            this.projects = []
            this.recentProjects = []
        }
    }
})

