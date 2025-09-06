<script setup>
import { useRoute, useRouter } from 'vue-router'
import SidebarLink from '@/components/app/sidebar/SidebarLink.vue'
import logoSrc from "@/assets/images/icons/badger-task-logo.png"
import LogoutButton from '@/components/shared/LogoutButton.vue'
import { useUserStore } from '@/stores/UserStore'
const emits = defineEmits(['toggleProjectSidebar'])
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()

const props = defineProps({
    toggleProjectSidebar: {
        type: Function,
        required: true
    }
})

const projectLinkClickHandler = () => {
    if (route.name !== 'dashboard' || route.name !== 'project') {
        router.push({name: 'dashboard'})
    }

    props.toggleProjectSidebar()
}
</script>

<template>
    <div class="py-4 h-full w-[90px] bg-dark text-ondark z-10">
        <ul class="flex flex-col gap-6 h-full">
            <RouterLink class="block w-full mb-8" :to="{ name: 'dashboard' }" is-link>
                <img class="w-14 mx-auto" :src="logoSrc" alt="">
            </RouterLink>

            <SidebarLink :to="{ name: 'dashboard' }"
                         icon-name="house-fill"
                         text="Home"
                         is-link
                         route-name="dashboard"
            />
            <SidebarLink icon-name="search" text="Search" />
            <div class="bg-ondark/25 h-[1px] w-2/3 mx-auto" />

            <SidebarLink icon-name="rocket-fill"
                         text="Projects"
                         route-name="project"
                         @click="projectLinkClickHandler"
            />
            <SidebarLink :to="{ name: 'agenda' }"
                         icon-name="calendar-check-fill"
                         text="Agenda"
                         is-link
                         route-name="agenda"
            />
            <div class="bg-ondark/25 h-[1px] w-2/3 mx-auto" />

            <div class="rounded-xl bg-ondark p-2 mx-2 mt-auto">
                <img :src="userStore.organisationImgUrl" alt="" class="w-4/5 mx-auto">
            </div>

            <LogoutButton />
            <!-- <RouterLink :to="{ name: 'user' }">
                User
            </RouterLink>  -->
            <!--<RouterLink :to="{ name: 'modal' }">
                modal
            </RouterLink>-->
        </ul>
    </div>
</template>

