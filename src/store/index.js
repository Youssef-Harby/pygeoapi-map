import { createStore } from 'vuex'
import { fetchCollections } from '@/api/pygeoapi'
import axios from 'axios'
import i18n, { loadLocaleMessages } from '@/i18n'

export default createStore({
  state: {
    config: null,
    collections: [],
    activeCollections: [],
    collectionColors: {},
    loading: false,
    error: null,
    locale: localStorage.getItem('pygeoapi_locale') || 'en-US'
  },
  mutations: {
    SET_CONFIG(state, config) {
      state.config = config
      state.loading = false
      state.error = null
    },
    SET_ERROR(state, error) {
      state.error = error
      state.loading = false
    },
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    SET_COLLECTIONS(state, collections) {
      state.collections = collections
      // Reset active collections when collections change
      state.activeCollections = []
      // Reset collection colors
      state.collectionColors = {}
    },
    SET_ACTIVE_COLLECTIONS(state, collectionIds) {
      state.activeCollections = collectionIds
    },
    SET_LOCALE(state, locale) {
      state.locale = locale
      localStorage.setItem('pygeoapi_locale', locale)
      // Reset collections state when locale changes
      state.activeCollections = []
      state.collectionColors = {}
    },
    SET_COLLECTION_COLOR(state, { id, color }) {
      state.collectionColors = {
        ...state.collectionColors,
        [id]: color
      }
    },
    SET_SERVER_URL(state, url) {
      if (state.config) {
        state.config.server = state.config.server || {}
        state.config.server.url = url
      }
      localStorage.setItem('pygeoapi_server_url', url)
      // Reset collections state when server URL changes
      state.activeCollections = []
      state.collectionColors = {}
    }
  },
  actions: {
    async initializeApp({ commit, dispatch }) {
      try {
        // Get the base path from window location
        const basePath = window.location.pathname.endsWith('/') 
          ? window.location.pathname 
          : window.location.pathname + '/'
        
        // Construct config path relative to current location
        const configPath = `${basePath}config.json`
        console.log('Loading config from:', configPath)
        
        const response = await axios.get(configPath)
        if (!response.data) {
          throw new Error('Config data is empty')
        }

        // Check for stored server URL
        const storedServerUrl = localStorage.getItem('pygeoapi_server_url')
        if (storedServerUrl) {
          response.data.server = response.data.server || {}
          response.data.server.url = storedServerUrl
        }
        
        commit('SET_CONFIG', response.data)
        
        // Set initial locale
        const storedLocale = localStorage.getItem('pygeoapi_locale')
        const locale = storedLocale || response.data.i18n?.defaultLocale || 'en-US'
        await dispatch('changeLocale', locale)
        
        // Load collections
        await dispatch('fetchCollections')
      } catch (error) {
        console.error('Failed to initialize app:', error)
        commit('SET_ERROR', 'Failed to initialize application')
      }
    },
    async fetchCollections({ commit, state }) {
      try {
        commit('SET_LOADING', true)
        const serverUrl = state.config?.server?.url
        if (!serverUrl) {
          throw new Error('Server URL not configured')
        }

        const collections = await fetchCollections(serverUrl, state.locale)
        commit('SET_COLLECTIONS', collections)
      } catch (error) {
        console.error('Error fetching collections:', error)
        commit('SET_ERROR', error.message)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async changeLocale({ commit, dispatch }, locale) {
      try {
        await loadLocaleMessages(locale)
        i18n.global.locale.value = locale
        // Set locale first to ensure UI updates
        commit('SET_LOCALE', locale)
        // Then reload collections with new locale
        await dispatch('fetchCollections')
      } catch (error) {
        console.error('Error changing locale:', error)
        commit('SET_ERROR', error.message)
      }
    },
    async toggleCollection({ commit, state }, collectionId) {
      try {
        const activeCollections = [...state.activeCollections]
        const index = activeCollections.indexOf(collectionId)
        
        if (index === -1) {
          activeCollections.push(collectionId)
        } else {
          activeCollections.splice(index, 1)
        }
        
        commit('SET_ACTIVE_COLLECTIONS', activeCollections)
        
        // If collection is being activated, ensure it has a color
        if (index === -1) {
          const collection = state.collections.find(c => c.id === collectionId)
          if (collection && !state.collectionColors[collectionId]) {
            const color = generateRandomColor()
            commit('SET_COLLECTION_COLOR', { id: collectionId, color })
          }
        }
      } catch (error) {
        console.error('Error toggling collection:', error)
        throw error
      }
    },
    async updateServerUrl({ commit, dispatch }, url) {
      try {
        commit('SET_SERVER_URL', url)
        // Reload collections with new server URL
        await dispatch('fetchCollections')
      } catch (error) {
        console.error('Error updating server URL:', error)
        throw error
      }
    }
  },
  getters: {
    isCollectionActive: (state) => (id) => {
      return state.activeCollections.includes(id)
    },
    getCollectionColor: (state) => (id) => {
      return state.collectionColors[id] || '#000000'
    },
    currentLocale: (state) => state.locale,
    serverUrl: (state) => state.config?.server?.url || '',
    supportedLocales: (state) => state.config?.i18n?.supportedLocales || []
  }
})

function generateRandomColor() {
  return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
}
