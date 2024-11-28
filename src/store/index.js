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

export default createStore({
  state: {
    collections: [],
    activeCollections: [],
    loading: false,
    error: null,
    locale: getInitialLocale(),
    serverUrl: getInitialServerUrl()
  },
  mutations: {
    SET_COLLECTIONS(state, collections) {
      console.log('Mutation: SET_COLLECTIONS', collections)
      state.collections = collections
    },
    SET_ACTIVE_COLLECTIONS(state, collectionIds) {
      console.log('Mutation: SET_ACTIVE_COLLECTIONS', collectionIds)
      state.activeCollections = []
      if (collectionIds && collectionIds.length) {
        state.activeCollections = collectionIds
      }
    },
    TOGGLE_COLLECTION(state, { collectionId, currentlyActive }) {
      console.log('Mutation: TOGGLE_COLLECTION', {
        collectionId,
        currentlyActive
      })
      const index = state.activeCollections.indexOf(collectionId)
      if (index === -1) {
        state.activeCollections.push(collectionId)
        console.log(`Collection ${collectionId} activated. New active collections:`, state.activeCollections)
      } else {
        state.activeCollections.splice(index, 1)
        console.log(`Collection ${collectionId} deactivated. New active collections:`, state.activeCollections)
      }
    },
    SET_LOADING(state, loading) {
      console.log('Mutation: SET_LOADING', loading)
      state.loading = loading
    },
    SET_ERROR(state, error) {
      console.log('Mutation: SET_ERROR', error)
      state.error = error
    },
    SET_LOCALE(state, locale) {
      if (!locale) {
        console.warn('Attempted to set empty locale')
        return
      }
      
      // Verify if locale is supported
      if (!config.i18n.supportedLocales.some(l => l.code === locale)) {
        console.warn(`Unsupported locale: ${locale}`)
        return
      }

      console.log('Mutation: SET_LOCALE', locale)
      state.locale = locale
      i18n.global.locale.value = locale
      
      // Store in localStorage for persistence
      localStorage.setItem('pygeoapi_locale', locale)
      
      // Update HTML dir attribute for RTL support
      const isRTL = config.i18n.supportedLocales.find(l => l.code === locale)?.direction === 'rtl'
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
      // Update HTML lang attribute
      document.documentElement.lang = locale
    },
    SET_SERVER_URL(state, url) {
      console.log('Mutation: SET_SERVER_URL', url)
      if (!url) {
        console.warn('Attempted to set empty server URL')
        return
      }
      // Remove trailing slash for consistency
      state.serverUrl = url.replace(/\/$/, '')
      // Store in localStorage for persistence
      localStorage.setItem('pygeoapi_server_url', state.serverUrl)
    }
  },
  actions: {
    async fetchCollections({ commit, state }) {
      try {
        console.log('Action: fetchCollections', { serverUrl: state.serverUrl })
        commit('SET_LOADING', true)
        commit('SET_ERROR', null)
        // Clear active collections when fetching new ones
        commit('SET_ACTIVE_COLLECTIONS', [])
        
        const collections = await fetchCollections(state.serverUrl, state.locale)
        commit('SET_COLLECTIONS', collections)
        
        return collections
      } catch (error) {
        console.error('Error fetching collections:', error)
        commit('SET_ERROR', error.message)
        return []
      } finally {
        commit('SET_LOADING', false)
      }
    },
    toggleCollection({ commit, state }, collectionId) {
      const currentlyActive = state.activeCollections.includes(collectionId)
      commit('TOGGLE_COLLECTION', { collectionId, currentlyActive })
    },
    async changeLocale({ commit, dispatch }, locale) {
      try {
        console.log('Action: changeLocale', locale)
        // Load locale messages if not already loaded
        await loadLocaleMessages(locale)
        
        commit('SET_LOCALE', locale)
        // Refetch collections with new locale
        await dispatch('fetchCollections')
      } catch (error) {
        console.error('Error changing locale:', error)
        commit('SET_ERROR', error.message)
      }
    },
    async updateServerUrl({ commit, dispatch }, url) {
      try {
        console.log('Action: updateServerUrl', url)
        if (!url) {
          throw new Error('Server URL cannot be empty')
        }
        commit('SET_SERVER_URL', url)
        // Refetch collections with new server URL
        await dispatch('fetchCollections')
      } catch (error) {
        console.error('Error updating server URL:', error)
        commit('SET_ERROR', error.message)
        // Revert to default URL on error
        commit('SET_SERVER_URL', config.server.url)
      }
    }
  },
  getters: {
    isCollectionActive: (state) => (collectionId) => {
      return state.activeCollections.includes(collectionId)
    },
    supportedLocales: () => config.i18n.supportedLocales
  }
})
