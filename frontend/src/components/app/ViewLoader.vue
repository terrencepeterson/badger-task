<script setup>
import loader from "@/assets/images/icons/my-loader.svg"
const props = defineProps({
    isLoading: {
        type: Boolean,
        required: true
    }
})
</script>

<template>
    <Transition>
        <div v-if="isLoading"
             class="w-full h-full absolute left-0 top-0 z-10 bg-white flex items-center justify-center"
        >
            <img :src="loader" alt="" class="w-[175px] h-[175px]">
        </div>
    </Transition>
</template>

<style>
.v-enter-active,
.v-leave-active {
    transition: opacity 0.5s ease;
}

.v-leave-to {
    opacity: 0;
}
</style>
