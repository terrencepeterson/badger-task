import { defineStore } from "pinia"

// if a task is opened via a link then the app is standalone
export const useUserStore = defineStore('UserStore', {
    state: () => ({
        isLoggedIn: false,
        id: null,
        name: '',
        avatarImg: '',
        description: '',
        email: '',
        hasInit: false
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
                    throw new Error(parsedData?.message ?? 'Internal server error')
                }
                this.setUser(parsedData.data)
            } catch(e) {
                // means the user isn't logged in which is ok
            }
        },
        reset() {
            this.isLoggedIn = false
            this.id = null
            this.name = ''
            this.avatarImg = ''
            this.description = ''
            this.email = ''
        }
    }
})

