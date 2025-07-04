<script setup>
import TheNav from "@/components/web/TheNav.vue"
</script>

<template>
    <TheNav />
    <main class="flex items-start justify-center">
        <RouterView name="web" />
    </main>
</template>

<style lang="scss" scoped>

</style>
