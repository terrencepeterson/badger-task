<script setup>
import VIcon from '@/components/shared/utilities/VIcon.vue'

const props = defineProps({
    name: {
        type: String,
        required: true
    }
})

defineEmits(['openDropDown'])
</script>

<template>
    <div class="rounded-full p-1 text-white transition-colors hover:bg-gray-900 cursor-pointer" @click="$emit('openDropDown')">
        <VIcon :name="name" />
    </div>
</template>

