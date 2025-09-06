<script setup>
import { SUCCESS_MESSAGE_TYPE, WARNING_MESSAGE_TYPE, ERROR_MESSAGE_TYPE } from '@/stores/MessageStore'
import VIcon from '../utilities/VIcon.vue'
import { onMounted, ref } from 'vue'
import { useMessageStore } from '@/stores/MessageStore'
import { onUnmounted } from 'vue'

const props = defineProps({
    id: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    }
})

const messageStore = useMessageStore()
const timeoutId = ref()
let classes = 'border '
let name = ''
let dotClasses = ''

switch (props.type) {
    case ERROR_MESSAGE_TYPE:
        classes += 'bg-error text-onerror border-onerror'
        name = 'exclamation-triangle-fill'
        dotClasses = 'bg-onerror'
        break
    case SUCCESS_MESSAGE_TYPE:
        classes += 'bg-success text-onsuccess border-onsuccess'
        name = 'check-circle'
        dotClasses = 'bg-onsuccess'
        break
    case WARNING_MESSAGE_TYPE:
        classes += 'bg-warning text-onwarning border-onwarning'
        name = 'info-circle'
        dotClasses = 'bg-onwarning'
        break
}

const closeClickHandler = () => {
    clearInterval(timeoutId)
    messageStore.removeMessage(props.id)
}

onMounted(() => {
    timeoutId.value = setTimeout(() => {
        messageStore.removeMessage(props.id)
    }, 5000)
})

onUnmounted(() => {
    clearInterval(timeoutId)
})
</script>

<template>
    <li class="rounded-input px-4 py-2 flex gap-2 items-center mb-4 cursor-pointer relative z-20" :class="classes" @click="closeClickHandler">
        <VIcon :name="name" />
        <span>
            {{ message }}
        </span>
        <span class="flex size-4 absolute -top-2 -right-2">
            <span class="absolute h-full w-full opacity-75 animate-ping rounded-full" :class="dotClasses" />
            <span class="relative size-4 rounded-full" :class="dotClasses" />
        </span>
    </li>
</template>

