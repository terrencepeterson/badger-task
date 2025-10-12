<script setup>
import TheSidebar from "@/components/app/TheSidebar.vue"
import TheProjectSidebar from "@/components/app/TheProjectSidebar.vue"
import TheTopbar from "@/components/app/TheTopbar.vue"
import ViewLoader from "@/components/app/ViewLoader.vue"
import { useStandloneTaskStore } from '@/stores/StandaloneTaskStore'
import { ref, provide } from "vue"
import { useUserStore } from "@/stores/UserStore"

const userStore = useUserStore()
const projectSidebarActive = ref(false)
const standaloneTaskStore = useStandloneTaskStore()
const toggleProjectSidebar = () => {
    projectSidebarActive.value = !projectSidebarActive.value
}
const viewIsLoading = ref(false)
const toggleIsViewLoading = () => viewIsLoading.value = !viewIsLoading.value
provide('toggleIsViewLoading', toggleIsViewLoading)
</script>

<template>
    <template v-if="!standaloneTaskStore.isStandalone">
        <div class="flex h-full max-w-screen overflow-x-hidden">
            <TheSidebar :toggle-project-sidebar="toggleProjectSidebar" />
            <div class="relative w-full max-w-full flex main-app">
                <div class="fixed bg-cover bg-center bg-no-repeat w-full h-full -z-10"
                     :style="{ backgroundImage: `url(${userStore.backgroundImgUrl})` }"
                />
                <TheProjectSidebar :active="projectSidebarActive" />
                <div class="relative w-full flex flex-col overflow-x-auto">
                    <ViewLoader :is-loading="viewIsLoading" />
                    <TheTopbar>
                        <RouterView name="appTopBar" />
                    </TheTopbar>
                    <main class="grow overflow-x-scroll">
                        <RouterView name="appMain" />
                    </main>
                </div>
            </div>
        </div>
    </template>
    <RouterView name="appModal" />
</template>
