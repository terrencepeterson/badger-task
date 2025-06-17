<script setup>
import TheSidebar from "@/components/TheSidebar.vue"
import TheProjectSidebar from "@/components/TheProjectSidebar.vue"
import TheTopbar from "@/components/TheTopbar.vue"
import { useStandloneTaskStore } from '@/stores/StandaloneTaskStore'

const standaloneTaskStore = useStandloneTaskStore()
</script>

<template>
    <template v-if="!standaloneTaskStore.isStandalone">
        <TheSidebar />
        <TheProjectSidebar />
        <TheTopbar>
            <RouterView name="topBar" />
        </TheTopbar>
        <main>
            <RouterView />
        </main>
    </template>
    <RouterView name="modal" />
</template>

