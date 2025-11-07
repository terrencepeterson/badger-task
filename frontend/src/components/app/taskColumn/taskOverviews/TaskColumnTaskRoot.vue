<script setup>
import { LoremIpsum } from "lorem-ipsum"
import VCircleIcon from '@/components/shared/utilities/VCircleIcon.vue'
import VIcon from "@/components/shared/utilities/VIcon.vue"
import ProjectHeader from '../../ProjectHeader.vue'
import VAvatar from '@/components/shared/utilities/VAvatar.vue'
import { inject, useTemplateRef, ref } from "vue"

const lorem = new LoremIpsum()
const generateRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const loremWords = lorem.generateWords(generateRandomNumber(5, 25))

const setPlaceholderCoordinates = inject('setPlaceholderCoordinates')
const removePlaceholder = inject('removePlaceholder')
const addPlaceholder = inject('addPlaceholder')
const taskRef = useTemplateRef('task')
const dragging = ref(false)
const hideElement = ref(false)

const props = defineProps({
    taskId: {
        type: Number,
        required: true
    },
    projectName: {
        type: String,
        required: false,
        default: 'Killer ink'
    },
    projectAvatarImgUrl: {
        type: String,
        required: false,
        default: 'https://res.cloudinary.com/dfixzkyvr/image/upload/q_auto/f_auto/v1749281515/project_undefined_avatar'
    },
    agendaColour: {
        type: [String, null],
        required: false,
        default: null
    },
    taskName: {
        type: String,
        required: true
    },
    assigneeAvatarImgUrl: {
        type: [String, null],
        required: false,
        default: null
    },
    assigneeName: {
        type: [String, null],
        required: false,
        default: null
    },
    tags: {
        type: Array,
        required: true
    },
    completed: {
        type: Boolean,
        required: true
    },
    row: {
        type: Number,
        required: true
    },
    columnProjectId: {
        type: Number,
        required: true
    }
})

const dragStartHandler = (e) => {
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("task", "")
    setPlaceholderCoordinates(props.columnProjectId, props.row, taskRef.value.$el.offsetHeight)
    // we don't add the placeholder or hide the task straight away, if you do so it affects [offsets by the placeholder height]
    // the 'copied' element under the cursor when dragging
    // however we want the copied element to have a border-primary so we do that here
    dragging.value = true

    setTimeout(() => {
        addPlaceholder()
        hideElement.value = true
    })
}

const dragEndHandler = () => {
    removePlaceholder()
    setPlaceholderCoordinates(null, null, null)
    hideElement.value = false
    dragging.value = false
}
</script>

<template>
    <RouterLink ref="task"
                class="task flex flex-col gap-4 p-4 rounded-lg bg-white cursor-pointer select-none
                border-2 shadow-sm hover:shadow-lg transition-shadow"
                :class="{ hidden: hideElement, 'border-primary': dragging, 'border-[#F5F5F5]': !dragging }"
                draggable="true"
                :to="{ name: 'modal' }"
                @dragstart="dragStartHandler"
                @dragend="dragEndHandler"
    >
        <div v-if="completed" class="bg-success flex -mx-4 -mt-4 py-2 px-4 rounded-t-lg gap-4">
            <span>
                <VIcon name="check-circle" class="text-onsuccess w-6 h-6" />
            </span>
            <span class="text-onsuccess font-bold">Completed</span>
        </div>
        <ProjectHeader
            v-if="projectName"
            :project-name="projectName"
            :avatar-img-url="projectAvatarImgUrl"
            container-element="header"
            class="text-grey-medium font-medium"
        />
        <div class="flex gap-4">
            <VCircleIcon
                v-if="agendaColour"
                icon="pin-angle-fill"
                :bg-colour="agendaColour"
                class="w-6 h-6 shrink-0"
                icon-classes="text-white"
            />
            <span class="hyphens-auto break-words overflow-hidden decoration-grey-medium" :class="{ 'line-through text-grey-medium': completed }">
                {{ taskName + loremWords }}
            </span>
            <span class="w-5 h-5 shrink-0 ms-auto">
                <VAvatar
                    v-if="assigneeAvatarImgUrl"
                    :avatar-url="assigneeAvatarImgUrl"
                    :alt-text="assigneeName"
                    :title="assigneeName"
                />
                <VCircleIcon
                    v-else
                    icon="person-x"
                    class="text-black border-dotted border-zinc-500 border-2 p-1 min-w-[28px]"
                    icon-classes="w-4 h-4"
                />
            </span>
        </div>
        <div v-if="tags?.length" class="flex gap-2 flex-wrap mt-2">
            <span v-for="{ id, colour, name } in tags"
                  :key="id"
                  :style="{ backgroundColor: colour}"
                  class="rounded-md px-2 py-1 text-xs text-white"
            >
                {{ name }}
            </span>
        </div>
    </RouterLink>
</template>

