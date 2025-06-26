import { defineStore } from "pinia"
import { generateRandomId } from "../utility"

export const SUCCESS_MESSAGE_TYPE = 'success'
export const ERROR_MESSAGE_TYPE = 'error'
export const WARNING_MESSAGE_TYPE = 'warning'

export const useMessageStore = defineStore('MessageStore', {
    state: () => ({
        messages: []
    }),
    actions: {
        addMessage(type, message) {
            if (this.messages.length > 3) {
                this.messages.pop()
            }
            const id = generateRandomId()
            this.messages.unshift({id, type, message})
        },
        removeMessage(id) {
            this.messages = this.messages.filter(m => m.id !== id)
        }
    }
})

