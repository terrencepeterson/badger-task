<script setup>
import LogoutButton from '@/components/shared/LogoutButton.vue'
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
                <LogoutButton />
            </div>
        </div>
    </div>
</template>

