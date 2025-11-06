import { createWebHistory, createRouter, } from "vue-router"
import { useUserStore } from "@/stores/UserStore"
import { ERROR_MESSAGE_TYPE, useMessageStore, WARNING_MESSAGE_TYPE } from "@/stores/MessageStore"
import routes from './routes'

const router = createRouter({
    routes,
    history: createWebHistory()
})

router.beforeEach(async (to) => {
    const userStore = useUserStore()
    const messageStore = useMessageStore()
    await userStore.initUser()

    if (to.meta.requiresAuth && !userStore.isLoggedIn) {
        messageStore.addMessage(ERROR_MESSAGE_TYPE, 'Unauthenticated - please log in')
        router.push({ name: 'logIn' })
    } else if (!to.meta.requiresAuth && userStore.isLoggedIn) {
        messageStore.addMessage(WARNING_MESSAGE_TYPE, `${userStore.name} is already logged in`)
        router.push({ name: 'dashboard' })
    }
})

export default router

