import { createStore } from 'vuex'
import { fetchCollections } from '@/api/pygeoapi'
import i18n, { loadLocaleMessages } from '@/i18n'
import config from '@/config.json'

// Get server URL from environment variables or config
const getInitialServerUrl = () => {
  // Check environment variables (if available through import.meta.env in Vite)
  const envUrl = import.meta.env?.VITE_PYGEOAPI_SERVER_URL

  // Check localStorage
  const storedUrl = localStorage.getItem('pygeoapi_server_url')

  // Return the first available value in order of priority
  return envUrl || storedUrl || config.server?.url || 'https://demo.pygeoapi.io/master'
}

// Get initial locale with priority
const getInitialLocale = () => {
  const storedLocale = localStorage.getItem('pygeoapi_locale')
  // Verify if stored locale is supported
  if (storedLocale && config.i18n.supportedLocales.some(l => l.code === storedLocale)) {
    return storedLocale
  }
  return config.i18n.defaultLocale || 'en'
}

// Predefined color palette with visually appealing colors
const COLOR_PALETTE = [
  '#4CAF50', // Material Green
  '#2196F3', // Material Blue
  '#9C27B0', // Material Purple
  '#FF9800', // Material Orange
  '#E91E63', // Material Pink
  '#00BCD4', // Material Cyan
  '#3F51B5', // Material Indigo
  '#FF5722', // Material Deep Orange
  '#009688', // Material Teal
  '#673AB7', // Material Deep Purple
  '#FFC107', // Material Amber
  '#795548', // Material Brown
  '#607D8B', // Material Blue Grey
  '#8BC34A', // Material Light Green
  '#F44336'  // Material Red
]

function generateRandomColor(state) {
  // Get a random color from our palette
  const unusedColors = COLOR_PALETTE.filter(color => {
    return !Object.values(state.collectionColors).includes(color)
  })
  
  if (unusedColors.length > 0) {
    return unusedColors[Math.floor(Math.random() * unusedColors.length)]
  }
  
  // If all colors are used, return a random one from the palette
  return COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]
}

export default createStore({
  state: {
    collections: [],
    activeCollections: [],
    loading: false,
    error: null,
    locale: getInitialLocale(),
    serverUrl: getInitialServerUrl(),
    collectionColors: {}
  },
  mutations: {
    SET_COLLECTIONS(state, collections) {
      state.collections = collections
    },
    SET_ACTIVE_COLLECTIONS(state, collectionIds) {
      state.activeCollections = collectionIds
    },
    TOGGLE_COLLECTION(state, { collectionId, currentlyActive }) {
      if (currentlyActive) {
        state.activeCollections = state.activeCollections.filter(id => id !== collectionId)
      } else {
        state.activeCollections.push(collectionId)
      }
    },
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    SET_ERROR(state, error) {
      state.error = error
    },
    SET_LOCALE(state, locale) {
      state.locale = locale
      i18n.global.locale.value = locale
      const localeConfig = config.i18n.supportedLocales.find(l => l.code === locale)
      if (localeConfig) {
        document.documentElement.dir = localeConfig.direction
        document.documentElement.lang = locale
        localStorage.setItem('pygeoapi_locale', locale)
      }
    },
    SET_SERVER_URL(state, url) {
      state.serverUrl = url
      localStorage.setItem('pygeoapi_server_url', url)
    },
    SET_COLLECTION_COLOR(state, { id, color }) {
      state.collectionColors[id] = color
    }
  },
  getters: {
    isCollectionActive: (state) => (collectionId) => {
      return state.activeCollections.includes(collectionId)
    },
    getCollectionColor: (state) => (collectionId) => {
      if (!state.collectionColors[collectionId]) {
        const color = generateRandomColor(state)
        state.collectionColors[collectionId] = color
      }
      return state.collectionColors[collectionId]
    },
    supportedLocales: () => config.i18n.supportedLocales,
    currentLocale: (state) => state.locale
  },
  actions: {
    async fetchCollections({ commit, state }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      try {
        const collections = await fetchCollections(state.serverUrl)
        commit('SET_COLLECTIONS', collections)
      } catch (error) {
        commit('SET_ERROR', error.message)
        console.error('Error fetching collections:', error)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    toggleCollection({ commit, state }, collectionId) {
      const currentlyActive = state.activeCollections.includes(collectionId)
      commit('TOGGLE_COLLECTION', { collectionId, currentlyActive })
    },
    async changeLocale({ commit }, locale) {
      try {
        await loadLocaleMessages(locale)
        commit('SET_LOCALE', locale)
      } catch (error) {
        console.error('Error changing locale:', error)
      }
    },
    updateServerUrl({ commit, dispatch }, url) {
      if (!url) {
        console.error('Invalid server URL')
        return
      }
      
      // Remove trailing slash if present
      const cleanUrl = url.replace(/\/$/, '')
      commit('SET_SERVER_URL', cleanUrl)
      
      // Refresh collections with new server URL
      dispatch('fetchCollections')
    },
    setCollectionColor({ commit }, { id, color }) {
      commit('SET_COLLECTION_COLOR', { id, color })
    }
  }
})
