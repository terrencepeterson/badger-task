<script setup>
import { ref, useTemplateRef, onMounted } from 'vue'
import VCircleIcon from '@/components/shared/utilities/VCircleIcon.vue'

const props = defineProps({
    id: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        required: true
    },
    taskCount: {
        type: Number,
        required: true
    },
    colour: {
        type: String,
        required: true
    },
})
const header = useTemplateRef('header')
const height = ref()
const isMouseOver = ref(false)

// must use this as using a template ref on a child component with script="setup" see
// https://vuejs.org/guide/essentials/template-refs.html#ref-on-component
defineExpose({
    height
})
onMounted(() => {
    height.value = header.value.offsetHeight
})
</script>

<template>
    <header
        ref="header"
        class="flex gap-2 items-center px-2 py-2 text-white text-xl cursor-pointer"
        :style="{ backgroundColor: colour }"
        @mouseenter="isMouseOver = true"
        @mouseleave="isMouseOver = false"
    >
        <VCircleIcon :icon="icon" class="shrink-0 w-9 h-9 p-1 hover:bg-zinc-400/50 transition-colors" icon-classes="h-5 w-5" />
        <input type="text" :value="name" class="min-w-0 overflow-ellipsis hover:bg-zinc-400/50 p-1 rounded-md">
        <VCircleIcon
            :class="{ invisible: !isMouseOver }"
            icon="three-dots"
            class="shrink-0 w-9 h-9 p-1 hover:bg-zinc-400/50 transition-colors"
            icon-classes="h-5 w-5"
        />
        <span v-if="taskCount" class="rounded-full px-2 py-1 flex items-center justify-center bg-zinc-100/25 text-base shrink-0 min-w-[32px] min-h-[32px]">
            {{ taskCount }}
        </span>
    </header>
</template>

