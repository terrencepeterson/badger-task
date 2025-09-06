<script setup>
import VIcon from '@/components/shared/utilities/VIcon.vue'
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const props = defineProps({
    iconName: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    isLink: {
        type: Boolean,
        required: false,
        default: false
    },
    routeName: {
        type: String,
        required: false,
        default: ''
    }
})

const active = computed(() => route.name === props.routeName)
const containerElement = props.isLink ? RouterLink : 'button'
</script>

<template>
    <component :is="containerElement" class="flex flex-col gap-1 justify-center w-full text-center cursor-pointer" :class="[active ? 'inset-shadow-sidebar-item': '']">
        <span>
            <VIcon :name="iconName" class="mx-auto w-5 h-5" />
        </span>
        <span class="text-sm">
            {{ text }}
        </span>
    </component>
</template>

<style lang="scss" scoped>

</style>

