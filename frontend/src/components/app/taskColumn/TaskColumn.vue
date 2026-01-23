<script setup>
import { onMounted, useTemplateRef, onUnmounted, computed, watch, ref, inject } from 'vue'
import VIcon from '@/components/shared/utilities/VIcon.vue'

const sentinelElement = useTemplateRef('sentinel')
const header = useTemplateRef('header')
const listContainerElement = useTemplateRef('list-container')
const setTaskPlaceholderCoordinates = inject('setTaskPlaceholderCoordinates')
const emit = defineEmits(['loadMoreTasks'])
const placeholder = ref()
const isDragEntered = ref(false)
const props = defineProps({
    headerConfig: {
        type: Object,
        required: true
    },
    taskConfigs: {
        type: Array,
        required: true
    },
    headerComponent: {
        type: Object,
        required: true
    },
    taskComponent: {
        type: Object,
        required: true
    },
    isDraggedTask: {
        type: Boolean,
        required: true
    },
    removeDraggedColumn: {
        type: Function,
        required: true
    },
    addColumnPlaceholder: {
        type: Function,
        required: true
    },
    moveDroppedColumn: {
        type: Function,
        required: true
    }
})
const shouldGetMoreTasks = computed(() => props.headerConfig.taskCount > props.taskConfigs.length)

let observer
onMounted(() => {
    if (!shouldGetMoreTasks.value) {
        return
    }

    observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
            emit('loadMoreTasks', props.headerConfig.id, props.taskConfigs.length - 1)
        }
    }, { rootMargin: '300px 300px 300px 300px', root: listContainerElement.value })
    observer.observe(sentinelElement.value)
})

onUnmounted(() => {
    observer?.disconnect()
})

watch(shouldGetMoreTasks, (newValue) => {
    if (!newValue) {
        observer?.disconnect()
    }
})

const dragEnterHandler = () => {
    isDragEntered.value = true
}

const dragLeaveHandler = () => {
    isDragEntered.value = false
}

const dragOverHandler = (e) => {
    if (!props.isDraggedTask) { // prevent task placeholder from showing when dragging columns
        return
    }

    if (e.dataTransfer.types.includes("task")) {
        e.preventDefault(); // without this the drop event doesn't fire!
    }

    if (placeholder.value instanceof Element) {
        const placeholderRect = placeholder.value.getBoundingClientRect()
        if (
            placeholderRect.top <= e.clientY &&
            placeholderRect.bottom >= e.clientY
        ) {
            return
        }
    }

    const taskElements = Array.from(listContainerElement.value.children)
    for (const [idx, taskElement] of taskElements.entries()) {
        if (taskElement === placeholder.value) continue
        const taskRect = taskElement.getBoundingClientRect()
        const taskMidwayPoint = taskRect.top + ((taskRect.bottom - taskRect.top) / 2)
        if (taskMidwayPoint < e.clientY) continue

        if (taskElements[idx - 1] === placeholder.value) return

        setTaskPlaceholderCoordinates(props.headerConfig.id, idx)
        return
    }
}

const dragEndHandler = () => {
    isDragEntered.value = false
    props.moveDroppedColumn()
}

const dragStartHandler = (e) => {
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("column", "")
    if (e.offsetY > header.value.height) { // if clicked outside of header
        e.preventDefault()
        return
    }

    setTimeout(() => {
        props.removeDraggedColumn(props.headerConfig)
        props.addColumnPlaceholder(props.headerConfig.column - 0.5)
    })
}
</script>

<template>
    <div class="min-w-[275px] max-w-[275px] relative flex flex-col"
         draggable="true"
         @dragstart.stop="dragStartHandler"
         @dragend.stop="dragEndHandler"
    >
        <component :is="headerComponent" v-bind="headerConfig" ref="header" />
        <ol ref="list-container"
            class="p-3 flex flex-col gap-3 overflow-y-scroll"
            :class="{ 'dragging': isDragEntered }"
            @dragenter="dragEnterHandler"
            @dragleave="dragLeaveHandler"
            @dragover="dragOverHandler"
            @drop="dropHandler"
        >
            <template v-for="taskConfig in taskConfigs" :key="taskConfig.taskId">
                <div v-if="taskConfig.placeholder"
                     :ref="(el) => placeholder = el"
                     class="placeholder border-2 border-primary rounded-lg shadow-md select-none w-full bg-white/30"
                     :style="{ minHeight: `${taskConfig.height}px` }"
                />
                <component
                    :is="taskComponent"
                    v-else
                    v-bind="taskConfig"
                />
            </template>
            <div ref="sentinel" class="invisible" />
            <div v-if="!taskConfigs.length" class="text-grey-dark flex flex-col justify-center items-center gap-2 select-none absolute top-1/2 left-1/2 -translate-1/2">
                <VIcon name="check-circle" class="w-16 h-16" />
                <span class="text-lg">No Tasks</span>
            </div>
        </ol>
    </div>
</template>

<style scoped>
.dragging * {
    pointer-events: none;
}
</style>

