<script setup>
const props = defineProps({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false,
        default: ''
    },
    width: {
        type: String,
        required: false,
        default: 'md'
    },
})

const containerWidth = props.width === 'md' ? 'w-80' : 'w-2xl'
</script>

<template>
    <div class="mx-auto" :class="containerWidth">
        <div class="mb-6 text-center">
            <h1 class="text-heading-primary font-bold text-p text-3xl mb-2">
                {{ title }}
            </h1>
            <p v-if="description" class="text-xl font-light text-grey-medium">
                {{ description }}
            </p>
        </div>
        <slot />
    </div>
</template>

