import { useStandloneTaskStore } from "@/stores/StandaloneTaskStore"

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

