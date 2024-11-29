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
    loading: true,
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
    },
    SET_ACTIVE_COLLECTIONS(state, collectionIds) {
      state.activeCollections = collectionIds
    },
    TOGGLE_COLLECTION(state, { collectionId, currentlyActive }) {
      const index = state.activeCollections.indexOf(collectionId)
      if (currentlyActive && index !== -1) {
        // Remove collection if it's active
        state.activeCollections.splice(index, 1)
      } else if (!currentlyActive && index === -1) {
        // Add collection if it's not active
        state.activeCollections.push(collectionId)
      }
    },
    SET_COLLECTION_COLOR(state, { id, color }) {
      state.collectionColors[id] = color
    },
    SET_LOCALE(state, locale) {
      state.locale = locale
      localStorage.setItem('pygeoapi_locale', locale)
      
      // Update document attributes if locale config exists
      const localeConfig = state.config?.i18n?.supportedLocales?.find(l => l.code === locale)
      if (localeConfig) {
        document.documentElement.dir = localeConfig.direction
        document.documentElement.lang = locale
      }
    },
    SET_SERVER_URL(state, url) {
      if (state.config) {
        state.config.server = state.config.server || {}
        state.config.server.url = url
      }
      localStorage.setItem('pygeoapi_server_url', url)
    }
  },
  getters: {
    isCollectionActive: state => collectionId => state.activeCollections.includes(collectionId),
    getCollectionColor: (state) => (collectionId) => {
      if (!state.collectionColors[collectionId]) {
        // Generate a random color if none exists
        const color = '#' + Math.floor(Math.random()*16777215).toString(16)
        state.collectionColors[collectionId] = color
      }
      return state.collectionColors[collectionId]
    },
    supportedLocales: state => state.config?.i18n?.supportedLocales || [],
    currentLocale: state => state.locale,
    serverUrl: state => state.config?.server?.url || '',
    defaultLocale: state => state.config?.i18n?.defaultLocale || 'en-US',
    fallbackLocale: state => state.config?.i18n?.fallbackLocale || 'en-US'
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
      commit('SET_LOADING', true)
      try {
        if (!state.config?.server?.url) {
          throw new Error('Server URL not configured')
        }
        const collections = await fetchCollections(state.config.server.url, state.locale)
        commit('SET_COLLECTIONS', collections)
      } catch (error) {
        console.error('Error fetching collections:', error)
        commit('SET_ERROR', 'Failed to fetch collections')
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async changeLocale({ commit }, locale) {
      try {
        await loadLocaleMessages(locale)
        i18n.global.locale.value = locale
        commit('SET_LOCALE', locale)
      } catch (error) {
        console.error('Error changing locale:', error)
      }
    },
    async toggleCollection({ commit, state }, collectionId) {
      try {
        const currentlyActive = state.activeCollections.includes(collectionId)
        commit('TOGGLE_COLLECTION', { collectionId, currentlyActive })
        return Promise.resolve()
      } catch (error) {
        console.error('Error in toggleCollection:', error)
        return Promise.reject(error)
      }
    },
    setCollectionColor({ commit }, { id, color }) {
      commit('SET_COLLECTION_COLOR', { id, color })
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
  }
})
