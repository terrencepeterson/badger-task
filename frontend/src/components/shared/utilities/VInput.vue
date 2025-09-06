<script setup>
import { ref, computed } from 'vue'
import VIcon from '@/components/shared/utilities/VIcon.vue'

const model = defineModel()
const selected = ref(false)
const props = defineProps({
    label: {
        type: String,
        required: false,
        default: ''
    },
    placeholder: {
        type: String,
        required: false,
        default: ''
    },
    type: {
        type: String,
        required: false,
        default: 'text'
    },
    icon: {
        type: String,
        required: false,
        default: ''
    },
    required: {
        type: Boolean,
        required: false
    },
    validationError: {
        type: String,
        required: false,
        default: ''
    },
    showClearButton: {
        type: Boolean,
        required: false,
        default: false
    }
})
const id = props.label.replaceAll(' ', '-') + '-input'
const clearClickHandler = () => {
    model.value = ''
}

let textClass = computed(() => {
    if (props.validationError) {
        return 'text-onerror'
    } else if (selected.value) {
        return 'text-brand-primary'
    }

    return 'text-grey-dark'
})
</script>

<template>
    <div class="mb-4 shrink-0" :class="textClass">
        <label v-if="label" :for="id" class="block mb-1 ">{{ label }}</label>
        <div class="relative">
            <span v-if="icon" class="absolute top-1/2 -translate-y-1/2 ms-2">
                <VIcon :name="icon" />
            </span>
            <input :id="id"
                   v-model="model"
                   :type="type"
                   :placeholder="placeholder"
                   class="focus:outline-2 px-1 py-2 outline rounded-input  placeholder:text-grey-light w-full transition-colors text-grey-dark"
                   :class="[icon ? 'ps-10' : 'ps-2', validationError ? 'outline-onerror focus:outline-onerror' : 'outline-grey-light focus:outline-brand-primary hover:outline-grey-dark focus:text-grey-dark']"
                   :required="required"
                   @focus="() => selected = true"
                   @blur="() => selected = false"
            >
            <span v-if="showClearButton" class="absolute top-1/2 -translate-y-1/2 ms-2 right-4 cursor-pointer !text-grey-dark" @click="clearClickHandler">
                <VIcon name="x-circle-fill" />
            </span>
        </div>
        <p class="text-onerror mt-1">
            {{ validationError }}
        </p>
    </div>
</template>

