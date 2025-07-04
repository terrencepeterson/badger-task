import { defineStore } from "pinia"

// if a task is opened via a link then the app is standalone
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

