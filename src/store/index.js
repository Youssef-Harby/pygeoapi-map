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
      if (currentlyActive) {
        state.activeCollections = state.activeCollections.filter(id => id !== collectionId)
      } else {
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
        // Load config from mounted path
        const response = await axios.get('/config.json')
        if (!response.data) {
          throw new Error('Config data is empty')
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
    toggleCollection({ commit, state }, collectionId) {
      const currentlyActive = state.activeCollections.includes(collectionId)
      commit('TOGGLE_COLLECTION', { collectionId, currentlyActive })
    },
    setCollectionColor({ commit }, { id, color }) {
      commit('SET_COLLECTION_COLOR', { id, color })
    }
  }
})
