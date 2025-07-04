import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMessageStore, ERROR_MESSAGE_TYPE, SUCCESS_MESSAGE_TYPE } from '@/stores/MessageStore'

export function useFetch() {
    const data = ref()
    const error = ref()
    const loading = ref()
    const validationErrors = ref()
    const router = useRouter()
    const messageStore = useMessageStore()

    const getData = async (url, method = 'GET', body) => {
        if (body && typeof body !== 'string') {
            body = JSON.stringify(body)
        }

        loading.value = true
        let parsedData
        try {
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body,
                credentials: 'include'
            })
            parsedData = await res.json()
            if (res.status < 200 || res.status > 299) {
                throw new Error(parsedData?.error.message)
            }

            data.value = parsedData.data

            if (parsedData.message) {
                messageStore.addMessage(SUCCESS_MESSAGE_TYPE, parsedData.message)
            }

            if (parsedData.redirectUrl) {
                router.push({ path: parsedData.redirectUrl })
            }
        } catch (e) {
            if (parsedData.error.fields) {
                validationErrors.value = parsedData.error.fields
            }

            messageStore.addMessage(ERROR_MESSAGE_TYPE, e.message ?? 'Internal server error')
            error.value = parsedData.error

            if (parsedData?.redirectUrl) {
                router.push({ path: parsedData.redirectUrl })
            }
        } finally {
            loading.value = false
        }
    }

    return { data, error, loading, getData, validationErrors }
}

