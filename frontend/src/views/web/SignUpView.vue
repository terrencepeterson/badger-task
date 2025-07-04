<script setup>
import WebAuthRoot from '@/components/web/WebAuthRoot.vue'
import VInput from '@/components/shared/utilities/VInput.vue'
import VButton from '@/components/shared/utilities/VButton.vue'
import { ref } from 'vue'
import { useFetch } from '@/composables/useFetch'

const email = ref('badgers@test.com')
const name = ref('mr badger')
const password = ref('A$$w0rd69')
const confirmPassword = ref('A$$w0rd69')
const { data, loading, error, getData, validationErrors } = useFetch()

const submitHandler = async (e) => {
    e.preventDefault()
    email.value = email.value.trim()
    await getData(`${import.meta.env.VITE_API_BASE_URL}/auth/sign-up`, "POST", {
        email: email.value,
        name: name.value,
        password: password.value,
        confirmPassword: confirmPassword.value
    })
    console.log(data)
}
</script>

<template>
    <WebAuthRoot title="Sign up" description="with your email address" width="lg">
        <form @submit="submitHandler">
            <div class="flex gap-8">
                <VInput v-model="email"
                        label="Email Address"
                        type="text"
                        placeholder="Email Addresss"
                        icon="envelope-fill"
                        :validation-error="validationErrors?.email"
                        class="w-[47.5%] max-w-[47.5%]"
                        required
                />
                <VInput v-model="name"
                        label="Full name"
                        type="text"
                        placeholder="Full name"
                        icon="person-fill"
                        :validation-error="validationErrors?.name"
                        class="w-[47.5%] max-w-[47.5%]"
                        required
                />
            </div>
            <div class="flex gap-8">
                <VInput v-model="password"
                        label="Password"
                        type="password"
                        placeholder="Password"
                        icon="key-fill"
                        :validation-error="validationErrors?.password"
                        class="w-[47.5%] max-w-[47.5%]"
                        required
                />
                <VInput v-model="confirmPassword"
                        label="Confirm Password"
                        type="password"
                        placeholder="Confirmd Password"
                        :validation-error="validationErrors?.confirmPassword"
                        icon="check-square-fill"
                        class="w-[47.5%] max-w-[47.5%]"
                        required
                />
            </div>
            <div class="w-[calc(50%-1rem)]">
                <VButton class="w-full">
                    Sign Up
                </VButton>
                <div class="flex justify-center p-2">
                    <RouterLink :to="{name: 'logIn'}" class="underline text-brand-primary">
                        I Already have an account
                    </RouterLink>
                </div>
            </div>
        </form>
    </WebAuthRoot>
</template>

