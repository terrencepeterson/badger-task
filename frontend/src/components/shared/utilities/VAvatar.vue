<script setup>
defineProps({
    avatarUrl: {
        type: String,
        required: true
    },
    altText: {
        type: String,
        required: false,
        default: ''
    }
})
</script>

<template>
    <span>
        <img :src="avatarUrl" :alt="altText">
        <span class="rounded-full" />
    </span>
</template>

