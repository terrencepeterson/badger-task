<script setup>
import MessageItem from "@/components/shared/messaging/MessageItem.vue"
import { useMessageStore } from "@/stores/MessageStore"

const messageStore = useMessageStore()
</script>

<template>
    <TransitionGroup name="list" tag="ul" class="absolute bottom-4 left-4">
        <MessageItem v-for="message in messageStore.messages" :key="message.id" v-bind="message" />
    </TransitionGroup>
</template>

<style>
.list-enter-active,
.list-leave-active {
    transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
    opacity: 0;
    transform: translateX(-150%);
}
</style>

