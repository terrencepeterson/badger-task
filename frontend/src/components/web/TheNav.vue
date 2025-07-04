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
        router.push({ name:"loggedOut" })
    } catch(e) {
        messageStore.addMessage(ERROR_MESSAGE_TYPE, 'Failed to logout')
    }
}
</script>

<template>
    <div>
        <div class="container">
            <div class="flex gap-8">
                <RouterLink :to="{name: 'logIn'}">
                    Login
                </RouterLink>
                <RouterLink :to="{name: 'signUp'}">
                    Get Started
                </RouterLink>
                <button :disabled="!userStore.isLoggedIn" @click="logoutClickHandler">
                    Logout
                </button>
            </div>
        </div>
    </div>
</template>

