<script setup>
import ProjectAvatar from '@/components/app/ProjectAvatar.vue'
defineProps({
    avatarImgUrl: {
        type: String,
        required: true
    },
    projectName: {
        type: String,
        required: true
    },
    containerElement: {
        type: String,
        required: false,
        default: 'div'
    }
})
</script>

<template>
    <component :is="containerElement" class="flex overflow-hidden items-center">
        <ProjectAvatar :avatar="avatarImgUrl" class="me-4 text-white" />
        <span class="overflow-hidden text-nowrap text-ellipsis text-sm">{{ projectName }}</span>
    </component>
</template>

