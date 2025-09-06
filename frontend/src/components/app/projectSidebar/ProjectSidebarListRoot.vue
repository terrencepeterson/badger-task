<script setup>
import ProjectSidebarListHeader from './ProjectSidebarListHeader.vue';
import ProjectSidebarListItem from './ProjectSidebarListItem.vue'
import { ref, computed } from 'vue'

const activeList = ref(true)
const props = defineProps({
    title: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        required: false,
        default: ''
    },
    projects: {
        type: Array,
        required: true
    },
    showCount: {
        type: Boolean,
        required: false,
        default: false
    },
    filterTerm: {
        type: String,
        required: true
    },
})

const filteredProjects = computed(() => props.filterTerm.trim().length ? props.projects.filter(p => p.projectName.includes(props.filterTerm)) : props.projects)
const active = computed(() => !!filteredProjects.value.length)
</script>

<template>
    <div v-show="active" class="mx-2">
        <ProjectSidebarListHeader :title="title"
                                  :icon="icon"
                                  :active="activeList"
                                  :count="showCount && !filterTerm.trim().length ? projects.length : null"
                                  @toggle-active="activeList = !activeList"
        />
        <ul v-show="activeList" class="flex flex-col">
            <ProjectSidebarListItem v-for="project in filteredProjects" :key="project.projectId" v-bind="project" />
        </ul>
    </div>
</template>

