<script setup>
</script>

<template>
    <div>the sidebar</div>
    <ul>
        <RouterLink :to="{ name: 'dashboard' }">
            Home
        </RouterLink>
        <RouterLink :to="{ name: 'project', params: { projectId: 1 } }">
            Projects
        </RouterLink>
        <RouterLink :to="{ name: 'agenda' }">
            Agenda
        </RouterLink>
        <RouterLink :to="{ name: 'user' }">
            User
        </RouterLink>
        <RouterLink :to="{ name: 'modal' }">
            modal
        </RouterLink>
    </ul>
</template>

