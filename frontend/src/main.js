import { createApp } from 'vue'
import { createPinia } from "pinia"
import MainComponent from './MainComponent.vue'
import './style.css'
import router from './router'

const pinia = createPinia()
const app = createApp(MainComponent)

app.directive("inline", (element) => { // so i can inline svgs
    if (element.children.length) {
        element.firstChild.classList.add(...element.classList)
        element.replaceWith(...element.children);
        element.classList.add('absolute')
    }
});

app.use(pinia)
app.use(router)
app.mount('#app')
