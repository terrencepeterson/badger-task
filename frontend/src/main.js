import { createApp } from 'vue'
import { createPinia } from "pinia"
import MainComponent from './MainComponent.vue'
import './style.css'
import router from './router'

const pinia = createPinia()
const app = createApp(MainComponent)

app.use(pinia)
app.use(router)
app.mount('#app')
