<script setup>
import MessageRoot from "@/components/shared/messaging/MessageRoot.vue"
import { useMessageStore } from "./stores/MessageStore"
</script>

<template>
    <h2 class="text-mint-500">
        test
    </h2>
    <RouterView />
    <MessageRoot />
</template>

