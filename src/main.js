import { createApp } from 'vue'
import App from './App.vue'
import store from './store'
import i18n from './i18n'

// Create Vue app
const app = createApp(App)

// Use plugins
app.use(store)
app.use(i18n)

// Mount app
app.mount('#app')
