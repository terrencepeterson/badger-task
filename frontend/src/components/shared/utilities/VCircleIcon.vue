<script setup>
import VIcon from '@/components/shared/utilities/VIcon.vue'

// set so bgColor can either be passed through as a string (e.g. #1234hhh') or use a fall through attr (tailwind class)
const props = defineProps({
    icon: {
        type: String,
        required: true
    },
    bgColour: {
        type: [String, undefined],
        required: false,
        default: undefined
    },
    iconClasses: {
        type: String,
        required: false,
        default: ''
    }
})

const containerStyleConfig = {}
if (props.bgColour) {
    containerStyleConfig.backgroundColor = props.bgColour
}
</script>

<template>
    <span class="rounded-full flex items-center justify-center" :style="containerStyleConfig">
        <VIcon :name="icon" :class="iconClasses" />
    </span>
</template>

