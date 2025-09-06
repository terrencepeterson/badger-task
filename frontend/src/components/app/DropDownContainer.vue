<script setup>
import DropDown from '@/components/app/DropDown.vue'
import { ref, provide } from 'vue'

const props = defineProps({
    dropDownTitle: {
        type: String,
        required: true
    }
})

const active = ref(false)
const closeHandler = () => active.value = false
const openHandler = () => active.value = true
provide('closeHandler', closeHandler)
provide('openHandler', openHandler)
</script>

<template>
    <div class="relative drop-down">
        <button type="button" @click="active = !active" class="rounded-full ">
            <slot name="icon" />
        </button>
        <DropDown v-if="active"
                  :title="dropDownTitle"
                  align="center"
        >
            <slot name="drop-down" />
        </DropDown>
    </div>
</template>

