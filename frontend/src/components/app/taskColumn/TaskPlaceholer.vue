<script setup>
const props = defineProps({
    height: {
        type: Number,
        required: true
    }
})
</script>

<template>
    <div class="border-2 border-primary rounded-lg shadow-md select-none w-full bg-white/30" :style="{ minHeight: `${height}px` }" />
</template>

