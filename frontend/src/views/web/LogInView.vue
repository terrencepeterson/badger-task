<script setup>
import { ref } from 'vue'
import VInput from '@/components/shared/utilities/VInput.vue'
import VButton from '@/components/shared/utilities/VButton.vue'
import WebAuthRoot from '@/components/web/WebAuthRoot.vue'
import { useFetch } from '@/composables/useFetch'
import { useUserStore } from '@/stores/UserStore'
import { useMessageStore, SUCCESS_MESSAGE_TYPE } from '@/stores/MessageStore'
import { useRouter } from 'vue-router'

const router = useRouter()
const messageStore = useMessageStore()
const userStore = useUserStore()
const emailAddress = ref('test5@test.com')
const password = ref('Password123#')
const { data, loading, error, getData, validationErrors } = useFetch()

const submitHandler = async (e) => {
    e.preventDefault()
    if (!emailAddress.value.length || !password.value.length) {
        error.value = "Email address and password are required fields"
        return
    }

    await getData(`${import.meta.env.VITE_API_BASE_URL}/auth/log-in`, "POST", {
        email: emailAddress.value,
        password: password.value
    })

    if (validationErrors.value) {
        return
    }

    await getData(`${import.meta.env.VITE_API_BASE_URL}/auth/user`)

    if (validationErrors.value) {
        return
    }

    userStore.setUser(data.value)
    router.push({ name: 'dashboard' })
}
</script>

<template>
    <WebAuthRoot title="Log In" description="with your account">
        <form @submit="submitHandler">
            <VInput v-model="emailAddress"
                    label="Email Address"
                    type="email"
                    placeholder="Email Addresss"
                    icon="envelope-fill"
                    :validation-error="validationErrors?.email"
                    required
            />
            <VInput v-model="password"
                    label="Password"
                    type="password"
                    placeholder="Password"
                    :validation-error="validationErrors?.password"
                    icon="key-fill"
                    required
            />
            <VButton class="w-full">
                Log In
            </VButton>
            <div class="flex justify-center p-2">
                <RouterLink :to="{name: 'signUp'}" class="underline text-brand-primary">
                    Or register here...
                </RouterLink>
            </div>
        </form>
    </WebAuthRoot>
</template>

