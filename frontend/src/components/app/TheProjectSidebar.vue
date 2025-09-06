<script setup>
import { useUserStore } from '@/stores/UserStore'
import ProjectSidebarIcon from '@/components/app/projectSidebar/ProjectSidebarIcon.vue'
import VInput from '@/components/shared/utilities/VInput.vue'
import ProjectSidebarListRoot from './projectSidebar/ProjectSidebarListRoot.vue'
import DropDownContainer from '@/components/app/DropDownContainer.vue'
import { ref, computed } from 'vue'

const props = defineProps({
    active: {
        type: Boolean,
        required: true
    }
})

const userStore = useUserStore()
const filterValue = ref('')
const recentProjects = computed(() => {
    return userStore.recentProjects.map(pId => userStore.projects.find(p => p.projectId === pId))
})
</script>

<template>
    <div class="bg-dark inset-shadow-project-sidebar py-8  w-[320px] text-white flex flex-col gap-6 overflow-x-hidden transition-[max-width]" :aria-hidden="!active" :class="{'max-w-0': !active, 'max-w-[320px]': active}">
        <div class="flex justify-between items-center px-5 mx-2">
            <span class="text-xl font-bold">Projects</span>
            <DropDownContainer drop-down-title="some test title">
                <template #icon>
                    <ProjectSidebarIcon name="plus-lg" />
                </template>
                <template #drop-down>
                    <ol>
                        <li>Test</li>
                        <li>Test</li>
                        <li>Test</li>
                        <li>Test</li>
                        <li>Test</li>
                    </ol>
                </template>
            </DropDownContainer>
        </div>
        <div class="px-5 mx-2">
            <VInput v-model="filterValue"
                    placeholder="Filter projects"
                    type="text"
                    icon="filter"
                    :show-clear-button="!!filterValue"
            />
        </div>
        <ProjectSidebarListRoot :key="recentProjects"
                                title="recent projects"
                                icon="clock"
                                :projects="recentProjects"
                                :filter-term="filterValue"
        />
        <ProjectSidebarListRoot title="my projects"
                                :projects="userStore.projects"
                                :filter-term="filterValue"
                                show-count
        />
    </div>
</template>

