<script setup>
import VIcon from '@/components/shared/utilities/VIcon.vue'

const props = defineProps({
    title: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        required: false,
        default: ''
    },
    active: {
        type: Boolean,
        required: true
    },
    count: {
        type: [Number, null],
        required: true
    },
})
const emits = defineEmits(['toggleActive'])
</script>

<template>
    <header class="ps-2 py-2 pe-7 flex relative items-center mb-2 cursor-pointer" @click="$emit('toggleActive')">
        <span class="absolute transition" :class="[active ? '' : '-rotate-90']">
            <VIcon name="chevron-down" class="w-3" />
        </span>
        <div class="ps-5 flex gap-2 items-center">
            <span v-if="icon"><VIcon :name="icon" class="w-[12px]" /></span>
            <span class="uppercase font-bold text-[12px]">{{ title }}</span>
        </div>
        <span v-if="count" class="ms-auto text-[12px] font-bold">{{ count }}</span>
    </header>
</template>

