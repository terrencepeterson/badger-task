<script setup>
defineProps({
    element: {
        type: String,
        required: false,
        default: ''
    }
})
</script>

<template>
    <template v-if="element">
        <component :is="element">
            <slot />
        </component>
    </template>
    <template v-else>
        <slot />
    </template>
</template>

