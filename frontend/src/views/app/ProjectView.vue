<script setup>
import { onMounted, inject, provide, computed, reactive, ref, useTemplateRef } from 'vue'
import { onBeforeRouteUpdate, useRoute } from 'vue-router'
import { useFetch } from '@/composables/useFetch'
import { addRecentlyViewedProject } from '@/localStorage.js'
import ViewError from '@/components/app/ViewError.vue'
import TaskColumn from '@/components/app/taskColumn/TaskColumn.vue'
import TaskColumnProjectHeader from '@/components/app/taskColumn/headers/TaskColumnProjectHeader.vue'
import TaskColumnTaskRoot from '@/components/app/taskColumn/taskOverviews/TaskColumnTaskRoot.vue'

const { data, error, getData: getEndpointData } = useFetch()
const draggedTask = ref(null)
const toggleIsViewLoading = inject('toggleIsViewLoading')
const route = useRoute()
const projectId = +route.params.projectId
const columnPlaceholderElement = ref()
const columnContainerElement = useTemplateRef('column-container')
const isDraggedColumn = computed(() => !!data.value?.columns.find(c => c.placeholder))

/* ### Draging task START ### */
const taskPlaceHolderConfig = reactive({ columnProjectId: null, row: null, height: null, taskId: Date.now(), placeholder: true })
const setTaskPlaceholderCoordinates = (col, row) => {
    removeTaskPlaceholder()
    taskPlaceHolderConfig.columnProjectId = col
    taskPlaceHolderConfig.row = row
    data.value.tasks.push(taskPlaceHolderConfig)
}
const addTaskPlaceholder = (col, row, height) => {
    taskPlaceHolderConfig.columnProjectId = col
    taskPlaceHolderConfig.row = row
    taskPlaceHolderConfig.height = height
    data.value.tasks.push(taskPlaceHolderConfig)
}
const removeTaskPlaceholder = () => {
    data.value.tasks = data.value.tasks.filter(t => !t.placeholder)
}
const removeDraggedTask = (taskId, row, columnId) => {
    draggedTask.value = data.value.tasks.find(t => t.taskId === taskId)
    data.value.tasks = data.value.tasks.filter(t => t.taskId !== taskId)
    data.value.tasks = data.value.tasks.map(t => ({
        ...t,
        ...(t.row > row && t.columnProjectId === columnId ? { row: t.row - 1 } : {})
    }))
}
const addDraggedTask = () => {
    data.value.tasks = data.value.tasks.map(t => ({
        ...t,
        ...(t.columnProjectId === taskPlaceHolderConfig.columnProjectId && t.row > taskPlaceHolderConfig.row ? { row: t.row + 1 } : {})
    }))
    draggedTask.value.row = Math.abs(Math.ceil(taskPlaceHolderConfig.row))
    draggedTask.value.columnProjectId = taskPlaceHolderConfig.columnProjectId
    data.value.tasks.push(draggedTask.value)
    taskPlaceHolderConfig.row = null
    taskPlaceHolderConfig.columnProjectId = null
    taskPlaceHolderConfig.height = null
    draggedTask.value = null
}
provide('setTaskPlaceholderCoordinates', setTaskPlaceholderCoordinates)
provide('addTaskPlaceholder', addTaskPlaceholder)
provide('removeTaskPlaceholder', removeTaskPlaceholder)
provide('removeDraggedTask', removeDraggedTask)
provide('addDraggedTask', addDraggedTask)
/* ### Draging task END ### */

/* ### Draging column START ### */
const columnPlaceholderConfig = reactive({ column: null, id: Date.now(), placeholder: true, draggedColumn: null })
const removeDraggedColumn = (columnConfig) => {
    columnPlaceholderConfig.draggedColumn = columnConfig
    data.value.columns = data.value.columns.filter(c => c.id !== columnConfig.id)
    data.value.columns = data.value.columns.map(c => ({
        ...c,
        ...((c.column > columnConfig.column) ? { column: c.column - 1 } : {})
    }))
}

const addColumnPlaceholder = (column) => {
    columnPlaceholderConfig.column = column
    data.value.columns.push(columnPlaceholderConfig)
}

const removeColumnPlaceholder = () => {
    data.value.columns = data.value.columns.filter(c => !c.placeholder)
}

const moveDroppedColumn = () => {
    data.value.columns = data.value.columns.map(c => ({
        ...c,
        ...( c.column > columnPlaceholderConfig.column ? { column: c.column + 1} : {})
    }))
    // we can have -0.5 at the start, we use Math.abs so that it is rounded to 0 and not -0
    columnPlaceholderConfig.draggedColumn.column = Math.abs(Math.ceil(columnPlaceholderConfig.column))
    data.value.columns.push(columnPlaceholderConfig.draggedColumn)
    removeColumnPlaceholder()
    columnPlaceholderConfig.column = null
    columnPlaceholderConfig.draggedColumn = null
}

const moveColumnPlaceholder = (column) => {
    removeColumnPlaceholder()
    addColumnPlaceholder(column)
}

const columnDragOverHandler = (e) => {
    if (draggedTask.value) {
        return
    }

    if (e.dataTransfer.types.includes("column")) {
        e.preventDefault(); // without this the drop event doesn't fire!
    }

    if (columnPlaceholderElement.value) {
        const placeholderRect = columnPlaceholderElement.value.getBoundingClientRect()
        if (
            e.clientX >= placeholderRect.left &&
            e.clientX <= placeholderRect.right
        ) {
            return
        }
    }

    const columns = Array.from(columnContainerElement.value.children)
    for (const [idx, column] of columns.entries()) {
        if (column === columnPlaceholderElement.value) continue
        const columnRect = column.getBoundingClientRect()
        const columnMidwayPoint = columnRect.left + (columnRect.width / 2)
        if (e.clientX > columnMidwayPoint) continue
        if (columns[idx - 1] === columnPlaceholderElement.value) return
        moveColumnPlaceholder(configs.value.columnHeaders[idx].column - 0.5)
        return
    }
}
/* ### Draging column END ### */

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
    const test = {
        tasksInColumns: ascendingColumnIds.map(columnId =>
            tasks.value
                .filter(task => task.columnProjectId === columnId) // gets tasks for column
                .sort((a, b) => a.row - b.row) // put in ascending order (by row)
        ),
        columnHeaders: ascendingColumnIds.map(cId => data.value.columns.find(c => c.id === cId))
    }
    // console.log(test)
    return test
})

const getData = async () => {
    await getEndpointData(route.meta.endpoint(route))
    toggleIsViewLoading()
}

addRecentlyViewedProject(projectId)
toggleIsViewLoading()

onMounted(async () => {
    await getData()
    console.log(data.value)
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
         ref="column-container"
         class="flex overflow-x-Scroll overflow-y-hidden h-full w-[calc(100%-90px)]"
         :class="{ 'remove-pointer-events': isDraggedColumn }"
         @dragover="columnDragOverHandler"
    >
        <template v-for="(columnHeader, idx) in configs.columnHeaders" :key="columnHeader.id">
            <TaskColumn
                v-if="!columnHeader.placeholder"
                :header-config="columnHeader"
                :task-configs="configs.tasksInColumns[idx]"
                :task-component="TaskColumnTaskRoot"
                :header-component="TaskColumnProjectHeader"
                :is-dragged-task="!!draggedTask"
                :remove-dragged-column="removeDraggedColumn"
                :add-column-placeholder="addColumnPlaceholder"
                :move-dropped-column="moveDroppedColumn"
                @load-more-tasks="addTasksToColumn"
            />
            <div v-else :ref="(el) => columnPlaceholderElement = el" class="min-w-[275px] max-w-[275px] p-2">
                <div class="" />
            </div>
        </template>
    </div>
</template>

<style scoped>
.remove-pointer-events * {
    /* pointer-events: none; */
}
</style>

