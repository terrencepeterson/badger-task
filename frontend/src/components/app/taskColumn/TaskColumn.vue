<script setup>
import { onMounted, useTemplateRef, onUnmounted, computed, watch } from 'vue'
import VIcon from '@/components/shared/utilities/VIcon.vue'
import TaskPlaceholder from '@/components/app/taskColumn/TaskPlaceholer.vue'

const sentinelElement = useTemplateRef('sentinel')
const listContainerElement = useTemplateRef('list-container')
const emit = defineEmits(['loadMoreTasks'])
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
</script>

<template>
    <div class="min-w-[275px] max-w-[275px] relative flex flex-col">
        <component :is="headerComponent" v-bind="headerConfig" />
        <ol v-if="taskConfigs.length" ref="list-container" class="p-3 flex flex-col gap-3 overflow-y-scroll">
            <template v-for="taskConfig in taskConfigs" :key="taskConfig.taskId">
                <TaskPlaceholder v-if="taskConfig.placeholder" :height="taskConfig.height" />
                <component
                    :is="taskComponent"
                    v-else
                    v-bind="taskConfig"
                />
            </template>
            <div ref="sentinel" class="invisible" />
        </ol>
        <div v-else class="text-grey-dark flex flex-col justify-center items-center gap-2 select-none absolute top-1/2 left-1/2 -translate-1/2">
            <VIcon name="check-circle" class="w-16 h-16" />
            <span class="text-lg">No Tasks</span>
        </div>
    </div>
</template>

