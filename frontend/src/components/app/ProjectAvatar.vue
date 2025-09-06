<script setup>
import VIcon from '@/components/shared/utilities/VIcon.vue'
const props = defineProps({
    avatarUrl: {
        type: String,
        required: false,
        default: ''
    }
})
</script>

<template>
    <img v-if="avatarUrl" :src="avatarUrl">
    <span v-else class="rounded-full w-6 h-6 p-1 flex items-center justify-center bg-ondark">
        <VIcon name="rocket-fill" class="text-white" />
    </span>
</template>

<style lang="scss" scoped>

</style>
