import { useStandloneTaskStore } from "@/stores/StandaloneTaskStore"
import { useUserStore } from "@/stores/UserStore"
import { useRouter } from "vue-router"
import { useMessageStore, WARNING_MESSAGE_TYPE } from "./stores/MessageStore"

export function keepDefaultView(to, from) {
    const standAloneTaskStore = useStandloneTaskStore()
    if (!from.matched.length) {
        standAloneTaskStore.setStandalone(true)
        return
    }

    to.matched[1].components.appMain = from.matched[1].components.appMain
    if (Object.hasOwn(from.matched[1].components, 'appTopBar')) {
        to.matched[1].components.appTopBar = from.matched[1].components.appTopBar
    }
}

export function beforeAuthGaurd() {
    const userStore = useUserStore()
    const router = useRouter()
    const messageStore = useMessageStore()

    if (userStore.isLoggedIn) {
        messageStore.addMessage(WARNING_MESSAGE_TYPE, `${userStore.name} is already logged in`)
        router.push({ name: 'dashboard' })
    }
}

