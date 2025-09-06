<script setup>
import ProjectAvatar from '@/components/app/ProjectAvatar.vue'
import ProjectSidebarIcon from '@/components/app/projectSidebar/ProjectSidebarIcon.vue';
import VIcon from '@/components/shared/utilities/VIcon.vue'
import { useRouter, useRoute } from 'vue-router'
import { ref, computed } from 'vue'

const router = useRouter()
const route = useRoute()
const props = defineProps({
    avatarImgUrl: {
        type: String,
        required: false,
        default: ''
    },
    projectName: {
        type: String,
        required: true
    },
    isPrivate: {
        type: Boolean,
        required: false,
        default: false
    },
    projectId: {
        type: Number,
        required: true
    }
})
const showSettings = ref(false)
const settingsClickHandler = () => {
    // open settings modal here - if the data isn't avaiable load it in
}
const linkClickHandler = () => {
    router.push({ name: 'project', params: { projectId: props.projectId} })
}
const active = computed(() => route.params.projectId == props.projectId)
</script>

<template>
    <li class="px-6 flex items-center cursor-pointer py-2 rounded-md transition-colors hover:bg-gray-800"
        :class="{ 'bg-gray-800': active }"
        @click="linkClickHandler"
        @mouseenter.stop="showSettings = true"
        @mouseleave.stop="showSettings = false"
    >
        <ProjectAvatar :avatar="avatarImgUrl" class="me-4" />
        <span class="overflow-hidden text-nowrap text-ellipsis text-sm">{{ projectName }}</span>
        <span class="ms-auto flex gap-2 items-center">
            <span class="transition-opacity" :class="[showSettings ? 'opacity-100' : 'opacity-0']" @click.stop="settingsClickHandler">
                <ProjectSidebarIcon name="three-dots" />
            </span>
            <span v-if="isPrivate">
                <VIcon name="lock-fill" />
            </span>
        </span>
    </li>
</template>

<style lang="scss" scoped>

</style>
