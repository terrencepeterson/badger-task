<script setup>
import VCircleIcon from '@/components/shared/utilities/VCircleIcon.vue'

defineProps({
    avatarUrl: {
        type: String,
        required: false,
        default: ''
    }
})
</script>

<template>
    <img v-if="avatarUrl" :src="avatarUrl">
    <VCircleIcon v-else
                 class="bg-ondark w-6 h-6 p-1 "
                 icon="rocket-fill"
    />
</template>

