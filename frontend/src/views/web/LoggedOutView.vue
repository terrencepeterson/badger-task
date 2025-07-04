<script setup>
import WebAuthRoot from '@/components/web/WebAuthRoot.vue'
import VButton from '@/components/shared/utilities/VButton.vue'
</script>

<template>
    <WebAuthRoot title="You've been logged out" description="Get back into your (work)flow in just a few clicks." width="lg">
        <div class="flex gap-8 justify-center">
            <VButton is-link :to="{name: 'index'}" class="px-4">
                Go to our homepage
            </VButton>
            <VButton is-link :to="{name: 'logIn'}" type="primaryOutline">
                Log back in
            </VButton>
        </div>
    </WebAuthRoot>
</template>

<style scoped>

</style>
