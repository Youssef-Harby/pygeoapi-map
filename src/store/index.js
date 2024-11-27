import { createStore } from 'vuex'
import { fetchCollections } from '@/api/pygeoapi'

export default createStore({
  state: {
    collections: [],
    activeCollections: [],
    loading: false,
    error: null
  },
  mutations: {
    SET_COLLECTIONS(state, collections) {
      console.log('Mutation: SET_COLLECTIONS', collections)
      state.collections = collections
    },
    SET_ACTIVE_COLLECTIONS(state, collectionIds) {
      console.log('Mutation: SET_ACTIVE_COLLECTIONS', collectionIds)
      state.activeCollections = collectionIds
    },
    TOGGLE_COLLECTION(state, collectionId) {
      console.log('Mutation: TOGGLE_COLLECTION', {
        collectionId,
        currentlyActive: state.activeCollections.includes(collectionId)
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
    }
  },
  actions: {
    async fetchCollections({ commit }) {
      console.log('Action: fetchCollections started')
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      try {
        const collections = await fetchCollections()
        console.log('Action: fetchCollections success', collections)
        commit('SET_COLLECTIONS', collections)
      } catch (error) {
        console.error('Action: fetchCollections error:', error)
        commit('SET_ERROR', error.message)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    toggleCollection({ commit, state }, collectionId) {
      console.log('Action: toggleCollection', {
        collectionId,
        currentState: {
          collections: state.collections,
          activeCollections: state.activeCollections
        }
      })
      commit('TOGGLE_COLLECTION', collectionId)
    }
  },
  getters: {
    isCollectionActive: (state) => (collectionId) => {
      const isActive = state.activeCollections.includes(collectionId)
      console.log('Getter: isCollectionActive', { collectionId, isActive })
      return isActive
    }
  }
})
