import { createWebHistory, createRouter } from "vue-router"
import { useUserStore } from "./stores/UserStore"
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
import LogInView from "@/views/web/LogInView.vue"
import SignUpView from "@/views/web/SignUpView.vue"
import LoggedOutView from "@/views/web/LoggedOutView.vue"
import { keepDefaultView, beforeAuthGaurd } from "@/routerGaurds.js"

const routes = [
    {
        path: '/',
        redirect: { name: 'index' },
        components: { default: WebView },
        meta: { requiresAuth: false },
        children: [
            { path: '/', name: 'index', components: { web: IndexView } },
            { path: '/log-in', name: 'logIn', components: { web: LogInView }, beforeEnter: beforeAuthGaurd },
            { path: '/sign-up', name: 'signUp', components: { web: SignUpView }, beforeEnter: beforeAuthGaurd },
            { path: '/logged-out', name: 'loggedOut', components: { web: LoggedOutView }, beforeEnter: beforeAuthGaurd },
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

router.beforeEach(async (to) => {
    const userStore = useUserStore()
    await userStore.initUser()
    if (to.meta.requiresAuth && !userStore.isLoggedIn) {
        router.push({ name: 'login' })
    }
})

export default router

