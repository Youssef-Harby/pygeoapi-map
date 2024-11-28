import { createApp } from 'vue'
import App from './App.vue'
import store from './store'
import i18n from './i18n'

// Create Vue app
const app = createApp(App)

// Use plugins
app.use(store)
app.use(i18n)

// Initialize app with config
store.dispatch('initializeApp').then(() => {
  // Set locale after config is loaded
  const savedLocale = localStorage.getItem('pygeoapi_locale')
  if (savedLocale) {
    store.commit('SET_LOCALE', savedLocale)
  }
  // Mount app
  app.mount('#app')
})
