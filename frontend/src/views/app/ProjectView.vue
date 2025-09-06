<script setup>
import { onMounted } from 'vue'
import { onBeforeRouteUpdate, useRoute } from 'vue-router'
import { addRecentlyViewedProject } from '@/localStorage.js'

const route = useRoute()
onMounted(() => addRecentlyViewedProject(+route.params.projectId))
onBeforeRouteUpdate((to) => addRecentlyViewedProject(+to.params.projectId))
</script>

<template>
    <div>
        <h1>Project View</h1>
        <p>{{ route.params.projectId }}</p>
        <RouterLink :to="{ name: 'project', params: { projectId: 10 }}" class="block mb-4">
            10
        </RouterLink>
        <RouterLink :to="{ name: 'project', params: { projectId: 11 }}" class="block mb-4">
            11
        </RouterLink>
        <RouterLink :to="{ name: 'project', params: { projectId: 12 }}" class="block mb-4">
            12
        </RouterLink>
        <RouterLink :to="{ name: 'project', params: { projectId: 13 }}" class="block mb-4">
            13
        </RouterLink>
        <RouterLink :to="{ name: 'project', params: { projectId: 14 }}" class="block mb-4">
            14
        </RouterLink>
    </div>
</template>

