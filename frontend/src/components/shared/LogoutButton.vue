<script setup>
import { useUserStore } from '@/stores/UserStore'
import { useMessageStore, ERROR_MESSAGE_TYPE, SUCCESS_MESSAGE_TYPE } from '@/stores/MessageStore'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const messageStore = useMessageStore()
const router = useRouter()

const logoutClickHandler = async () => {
    try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`, {
            credentials: 'include'
        })
        if (res.status < 200 || res.status > 299) {
            throw new Error()
        }
        userStore.reset()
        messageStore.addMessage(SUCCESS_MESSAGE_TYPE, 'Successfully logged out')
        router.push({ name: "loggedOut" })
    } catch(e) {
        console.log(e)
        messageStore.addMessage(ERROR_MESSAGE_TYPE, 'Failed to logout')
    }
}
</script>

<template>
    <button :disabled="!userStore.isLoggedIn" class="cursor-pointer" @click="logoutClickHandler">
        Logout
    </button>
</template>

