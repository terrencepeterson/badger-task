import { defineStore } from "pinia"

export const useStandloneTaskStore = defineStore('StandaloneTaskStore', {
    state: () => ({
        isStandalone: false
    }),
    actions: {
        setStandalone(isStandalone) {
            this.isStandalone = isStandalone
        }
    }
})

