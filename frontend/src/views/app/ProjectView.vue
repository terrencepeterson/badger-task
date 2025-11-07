<script setup>
import { onMounted, inject, provide, computed, ref } from 'vue'
import { onBeforeRouteUpdate, useRoute } from 'vue-router'
import { useFetch } from '@/composables/useFetch'
import { addRecentlyViewedProject } from '@/localStorage.js'
import ViewError from '@/components/app/ViewError.vue'
import TaskColumn from '@/components/app/taskColumn/TaskColumn.vue'
import TaskColumnProjectHeader from '@/components/app/taskColumn/headers/TaskColumnProjectHeader.vue'
import TaskColumnTaskRoot from '@/components/app/taskColumn/taskOverviews/TaskColumnTaskRoot.vue'

const { data, error, getData: getEndpointData } = useFetch()
const toggleIsViewLoading = inject('toggleIsViewLoading')
const route = useRoute()
const projectId = +route.params.projectId
const placeholderConfig = ref({ columnProjectId: null, row: null, height: null, taskId: Date.now(), placeholder: true })
const setPlaceholderCoordinates = (col, row, height) => {
    data.value.tasks = data.value.tasks.map(t => ({ ...t, ...(t.columnProjectId === placeholderConfig.value.columnProjectId && t.row > placeholderConfig.value.row ? { row: t.row += 1 } : {} )}))
    placeholderConfig.value.columnProjectId = col
    placeholderConfig.value.row = row
    placeholderConfig.value.height = height
    console.log(placeholderConfig.value)
    data.value.tasks = data.value.tasks.map(t => ({ ...t, ...(t.columnProjectId === col && t.row >= row ? { row: t.row += 1 } : {} )}))
}
const addPlaceholder = () => {
    data.value.tasks.push(placeholderConfig.value)
}
const removePlaceholder = () => {
    data.value.tasks = data.value.tasks.filter(t => !t.placeholder)
}
provide('setPlaceholderCoordinates', setPlaceholderCoordinates)
provide('addPlaceholder', addPlaceholder)
provide('removePlaceholder', removePlaceholder)

// when data passed from backend the tasks only have the ids for the user and the tags
// this converts the ids to the actual config objects
const tasks = computed(() => {
    return data.value?.tasks.map(task => {
        if (task.placeholder) {
            return task
        }

        const user = data.value.users.find(u => u.id == task.assigneeId)
        const tags = task.tags.map(tId => data.value.tags.find(t => t.id == tId))
        return {
            ...task,
            completed: task.state === 'completed',
            tags,
            assigneeAvatarImgUrl: user ? user.avatarImgUrl : null,
            assigneeName: user ? user.name : null
        }
    })
})

const configs = computed(() => {
    if (!data.value?.columns) {
        return []
    }

    const ascendingColumnIds = [...data.value.columns].sort((a, b) => a.column - b.column).map(c => c.id)
    return {
        tasksInColumns: ascendingColumnIds.map(columnId =>
            tasks.value
                .filter(task => task.columnProjectId === columnId) // gets tasks for column
                .sort((a, b) => a.row - b.row) // put in ascending order (by row)
        ),
        columnHeaders: ascendingColumnIds.map(cId => data.value.columns.find(c => c.id === cId))
    }
})

const getData = async () => {
    await getEndpointData(route.meta.endpoint(route))
    toggleIsViewLoading()
}

addRecentlyViewedProject(projectId)
toggleIsViewLoading()

onMounted(async () => {
    await getData()
})

onBeforeRouteUpdate(async (to) => {
    addRecentlyViewedProject(+to.params.projectId)
    toggleIsViewLoading()
    await getData()
})

const addTasksToColumn = async (columnId, row) => {
    const params = new URLSearchParams({ row })
    const endpoint = `${import.meta.env.VITE_API_BASE_URL}/project/${projectId}/column/${columnId}?${params}`
    const res = await fetch(endpoint, {
        headers: {
            "Content-Type": "application/json",
        },
        credentials: 'include'
    })
    const { data: newTasks } = await res.json()
    data.value.tasks.push(...newTasks)
}
</script>

<template>
    <ViewError v-if="error" />
    <div v-else
         class="flex overflow-x-scroll overflow-y-hidden h-full w-[calc(100%-90px)]"
    >
        <TaskColumn
            v-for="(columnHeader, idx) in configs.columnHeaders"
            :key="columnHeader.id"
            :header-config="columnHeader"
            :task-configs="configs.tasksInColumns[idx]"
            :task-component="TaskColumnTaskRoot"
            :header-component="TaskColumnProjectHeader"
            @load-more-tasks="addTasksToColumn"
        />
    </div>
</template>

