<script setup>
import TheSidebar from "@/components/app/TheSidebar.vue"
import TheProjectSidebar from "@/components/app/TheProjectSidebar.vue"
import TheTopbar from "@/components/app/TheTopbar.vue"
import { useStandloneTaskStore } from '@/stores/StandaloneTaskStore'
import { ref } from "vue"
import { useUserStore } from "@/stores/UserStore"

const userStore = useUserStore()
const projectSidebarActive = ref(false)
const standaloneTaskStore = useStandloneTaskStore()
const toggleProjectSidebar = () => projectSidebarActive.value = !projectSidebarActive.value
</script>

<template>
    <template v-if="!standaloneTaskStore.isStandalone">
        <div class="flex h-full">
            <TheSidebar :toggle-project-sidebar="toggleProjectSidebar" />
            <TheProjectSidebar :active="projectSidebarActive" />
            <div class="bg-cover bg-center bg-no-repeat w-full max-w-full" :style="{backgroundImage: `url(${userStore.backgroundImgUrl})`}">
                <TheTopbar>
                    <RouterView name="appTopBar" />
                </TheTopbar>
                <main>
                    <RouterView name="appMain" />
                </main>
            </div>
        </div>
    </template>
    <RouterView name="appModal" />
</template>

