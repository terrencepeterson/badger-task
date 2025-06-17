import { createWebHistory, createRouter } from "vue-router"
import { useStandloneTaskStore } from "@/stores/StandaloneTaskStore"
import DashboardView from "@/views/app/DashboardView.vue"
import DashboardTopbar from "@/layout/topbar/DashboardTopbar.vue"
import ProjectTopbar from "@/layout/topbar/ProjectTopbar.vue"
import ProjectView from "@/views/app/ProjectView.vue"
import AgendaTopbar from "@/layout/topbar/AgendaTopbar.vue"
import AgendaView from "@/views/app/AgendaView.vue"
import UserView from "@/views/app/UserView.vue"
import ModalView from "@/views/app/ModalView.vue"

function keepDefaultView(to, from) {
    const standAloneTaskStore = useStandloneTaskStore()
    if (!from.matched.length) {
        standAloneTaskStore.setStandalone(true)
        return
    }

    to.matched[1].components.default = from.matched[1].components.default
    if (Object.hasOwn(from.matched[1].components, 'topBar')) {
        to.matched[1].components.topBar = from.matched[1].components.topBar
    }
}

const routes = [
    {
        path: '/app',
        children: [
            { path: 'dashboard', name: 'dashboard', components: { default: DashboardView, topBar: DashboardTopbar } },
            { path: 'project/:projectId', name: 'project', components: { default: ProjectView, topBar: ProjectTopbar } },
            { path: 'agenda', name: 'agenda', components: { default: AgendaView, topBar: AgendaTopbar } },
            { path: 'user', name: 'user', components: { default: UserView } },
            { path: 'modal', name: 'modal', components: { modal: ModalView }, beforeEnter: [keepDefaultView] }
        ]
    }
]

const router = createRouter({
    routes,
    history: createWebHistory()
})

export default router
