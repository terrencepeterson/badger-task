<script setup>
import VIcon from '@/components/shared/utilities/VIcon.vue'
import { useEventListener } from '@/composables/event'
import { computed, inject } from 'vue'

const closeHandler = inject('closeHandler')
const props = defineProps({
    title: {
        type: String,
        required: true
    },
    align: {
        type: String,
        required: true,
        validator(value) {
            return ['center', 'right', 'left'].includes(value)
        }
    },
})

const alignment = computed(() => {
    switch (props.align) {
        case 'center':
            return 'left-1/2 -translate-x-1/2'
        case 'left':
            return 'left-0'
        case 'right':
            return 'right-0'
    }
})

useEventListener(window, 'click', ({target}) => {
    if (!target.closest('.drop-down')) {
        closeHandler()
    }
})
</script>

<template>
    <div class="absolute top-6 rounded-lg shadow-lg p-4 bg-white text-black z-50" :class="[alignment]">
        <header class="flex justify-between gap-4 items-center mb-4">
            <p class="font-bold text-nowrap text-lg">
                {{ title }}
            </p>
            <span class="cursor-pointer" @click="closeHandler">
                <VIcon name="x-circle-fill" class="w-5 h-5" />
            </span>
        </header>
        <slot />
    </div>
</template>
