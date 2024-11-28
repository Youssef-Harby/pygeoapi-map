import { createApp } from 'vue'
import App from './App.vue'
import store from './store'
import i18n from './i18n'

// Initialize store with saved locale
const savedLocale = localStorage.getItem('pygeoapi_locale')
if (savedLocale) {
  store.commit('SET_LOCALE', savedLocale)
}

// Create Vue app
const app = createApp(App)

// Use plugins
app.use(store)
app.use(i18n)

// Mount app
app.mount('#app')
