<script setup>
import VWrappingElement from '@/components/shared/utilities/VWrappingElement.vue'
import VIcon from '@/components/shared/utilities/VIcon.vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
    icon: {
        type: String,
        required: false,
        default: ''
    },
    isLink: {
        type: Boolean,
        required: false,
        default: false
    },
    type: {
        type: String,
        required: false,
        default: 'primary'
    }
})

const elementType = props.isLink ? RouterLink : 'button'
let classes = 'rounded-input flex justify-center items-center gap-2 p-2 cursor-pointer transition-colors '
switch (props.type) {
    case 'primary':
        classes += 'bg-brand-primary hover:bg-brand-primary-hover text-onbrand-primary'
        break
    case 'primaryOutline':
        classes += 'bg-transparent border border-brand-primary text-brand-primary hover'
        break
}
</script>

<template>
    <component :is="elementType" :class="classes">
        <VIcon :name="icon" />
        <VWrappingElement :element="icon ? 'span' : ''">
            <slot />
        </VWrappingElement>
    </component>
</template>

