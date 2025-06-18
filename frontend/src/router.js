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
import AppView from "@/views/app/AppView.vue"
import WebView from "@/views/web/WebView.vue"
import IndexView from "@/views/web/IndexView.vue"
import LoginView from "@/views/web/LoginView.vue"
import SignUpView from "@/views/web/SignUpView.vue"

function keepDefaultView(to, from) {
    const standAloneTaskStore = useStandloneTaskStore()
    if (!from.matched.length) {
        standAloneTaskStore.setStandalone(true)
        return
    }

    to.matched[1].components.appMain = from.matched[1].components.appMain
    if (Object.hasOwn(from.matched[1].components, 'appTopBar')) {
        to.matched[1].components.appTopBar = from.matched[1].components.appTopBar
    }
}

const routes = [
    {
        path: '/',
        redirect: { name: 'index' },
        components: { default: WebView },
        meta: { requiresAuth: false },
        children: [
            { path: '/', name: 'index', components: { web: IndexView } },
            { path: '/login', name: 'login', components: { web: LoginView } },
            { path: '/sign-up', name: 'signup', components: { web: SignUpView } }
        ]
    },
    {
        path: '/app',
        redirect: { name: 'dashboard' },
        components: { default: AppView },
        meta: { requiresAuth: true },
        children: [
            { path: 'dashboard', name: 'dashboard', components: { appMain: DashboardView, appTopBar: DashboardTopbar } },
            { path: 'project/:projectId', name: 'project', components: { appMain: ProjectView, appTopBar: ProjectTopbar } },
            { path: 'agenda', name: 'agenda', components: { appMain: AgendaView, appTopBar: AgendaTopbar } },
            { path: 'user', name: 'user', components: { appMain: UserView } },
            { path: 'modal', name: 'modal', components: { appModal: ModalView }, beforeEnter: [keepDefaultView] }
        ]
    }
]

const router = createRouter({
    routes,
    history: createWebHistory()
})

export default router
