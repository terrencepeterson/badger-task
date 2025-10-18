<script setup>
defineProps({
    errorTeleportElementSelector: {
        type: String,
        default: '.main-app',
        required: false
    }
})
</script>

<template>
    <Teleport :to="errorTeleportElementSelector">
        <div class="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-whiteish">
            <span class="px-24 text-center">Internal server error, please refresh the page. If this problem persists please contact BadgerTask technical support.</span>
        </div>
    </Teleport>
</template>

