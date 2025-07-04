<script setup>
import { onMounted, ref } from "vue"

const props = defineProps({
    name: {
        type: String,
        required: true
    }
})

const iconHtml = ref('')
onMounted(async () => {
    if (!props.name) {
        return
    }

    try {
        const { default: iconTemp } = await import(`../../../assets/images/icons/${props.name}.svg?raw`)
        iconHtml.value = iconTemp
    } catch(e) {
        console.error(e)
        iconHtml.value = "" // just in case
    }
})
</script>

<template>
    <svg v-if="iconHtml" v-inline v-html="iconHtml" />
</template>

