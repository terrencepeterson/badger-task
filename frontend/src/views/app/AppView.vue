<script setup>
import TheSidebar from "@/components/app/TheSidebar.vue"
import TheProjectSidebar from "@/components/app/TheProjectSidebar.vue"
import TheTopbar from "@/components/app/TheTopbar.vue"
import { useStandloneTaskStore } from '@/stores/StandaloneTaskStore'

const standaloneTaskStore = useStandloneTaskStore()
</script>

<template>
    <template v-if="!standaloneTaskStore.isStandalone">
        <TheSidebar />
        <TheProjectSidebar />
        <TheTopbar>
            <RouterView name="appTopBar" />
        </TheTopbar>
        <main>
            <RouterView name="appMain" />
        </main>
    </template>
    <RouterView name="appModal" />
</template>

