<template>
  <aside class="sidebar" :class="{ 'sidebar-collapsed': isCollapsed }">
    <div class="collections-header">
      <div class="header-content">
        <h2>{{ $t('sidebar.collections') }}</h2>
        <div class="search-container">
          <input 
            type="text"
            v-model="searchQuery"
            :placeholder="$t('sidebar.searchPlaceholder')"
            class="search-input"
          />
          <span class="search-icon">
            <i class="fas fa-search"></i>
          </span>
        </div>
      </div>
    </div>

    <div class="collections-container" v-if="!isCollapsed">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <span>{{ $t('common.loading') }}</span>
      </div>

      <div v-else-if="error" class="error-state">
        <i class="fas fa-exclamation-circle"></i>
        <span>{{ error }}</span>
        <button @click="retryFetch" class="retry-button">
          <i class="fas fa-sync"></i>
          {{ $t('common.retry') }}
        </button>
      </div>

      <div v-else-if="collections.length === 0" class="empty-state">
        <i class="fas fa-folder-open"></i>
        <span>{{ $t('sidebar.noCollections') }}</span>
      </div>

      <template v-else>
        <div class="collections-list">
          <div 
            v-for="collection in filteredCollections" 
            :key="collection.id"
            class="collection-item"
            :class="{ active: isCollectionActive(collection.id) }"
            :style="{ borderColor: isCollectionActive(collection.id) ? getCollectionColor(collection.id) : 'transparent' }"
            @click="toggleCollection(collection.id)"
          >
            <div class="collection-info">
              <div class="collection-header">
                <h3 class="collection-title">{{ collection.title || collection.id }}</h3>
              </div>
              <span 
                class="collection-type" 
                :class="getCollectionType(collection)"
              >
                {{ getCollectionType(collection) }}
              </span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div v-else class="sidebar-mini">
      <div 
        v-for="collection in collections" 
        :key="collection.id"
        class="mini-collection"
        :class="{ active: isCollectionActive(collection.id) }"
        @click="toggleCollection(collection.id)"
        :title="collection.title || collection.id"
      >
        <i :class="getCollectionIcon(collection)"></i>
      </div>
    </div>
  </aside>
</template>

<script>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { getCollectionRenderType } from '@/api/pygeoapi'

export default {
  name: 'Sidebar',
  setup() {
    const store = useStore()
    const isCollapsed = ref(false)
    const searchQuery = ref('')

    const collections = computed(() => store.state.collections)
    const loading = computed(() => store.state.loading)
    const error = computed(() => store.state.error)
    const isCollectionActive = (id) => store.getters.isCollectionActive(id)

    const getCollectionType = (collection) => {
      const type = getCollectionRenderType(collection)
      return type.toLowerCase()
    }

    const getCollectionColor = (collectionId) => {
      return store.getters.getCollectionColor(collectionId)
    }

    const filteredCollections = computed(() => {
      if (!searchQuery.value) return collections.value
      const query = searchQuery.value.toLowerCase()
      return collections.value.filter(collection => 
        (collection.title?.toLowerCase().includes(query) || 
         collection.id?.toLowerCase().includes(query))
      )
    })

    const toggleCollection = (id) => {
      store.dispatch('toggleCollection', id)
    }

    const retryFetch = () => {
      store.dispatch('fetchCollections')
    }

    return {
      isCollapsed,
      collections,
      loading,
      error,
      searchQuery,
      filteredCollections,
      isCollectionActive,
      toggleCollection,
      retryFetch,
      getCollectionType,
      getCollectionColor
    }
  }
}
</script>

<style>
.sidebar {
  position: absolute;
  top: 0;
  left: 0;
  width: var(--sidebar-width);
  height: 100%;
  background-color: var(--bg-color);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  z-index: 10;
}

.sidebar.sidebar-collapsed {
  width: var(--sidebar-collapsed-width);
}

.collections-header {
  position: sticky;
  top: 0;
  background-color: var(--bg-color);
  z-index: 3;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header-content h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
}

.search-container {
  position: relative;
  width: 100%;
  margin: 8px 0;
}

.search-input {
  width: 100%;
  padding: 8px 32px 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: var(--bg-color);
  color: var(--text-color);
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.1);
}

.search-icon {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

[dir="rtl"] .search-icon {
  right: auto;
  left: 8px;
}

[dir="rtl"] .search-input {
  padding: 8px 12px 8px 32px;
}

.collections-container {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.collections-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
}

.collection-item {
  padding: 12px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  border-left: 4px solid transparent;
}

[dir="rtl"] .collection-item {
  border-left: none;
  border-right: 4px solid transparent;
}

.collection-item:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transform: translateY(-1px);
  z-index: 10;
}

.collection-item:hover .collection-title {
  white-space: normal;
  overflow: visible;
  position: relative;
  z-index: 11;
}

.collection-title {
  margin: 0;
  padding: 0;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
  transition: all 0.3s ease;
}

.collection-item.active .collection-title {
  color: var(--text-color);
  font-weight: 600;
}

.collection-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.collection-header {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0;
  margin: 0;
}

.collection-type {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  padding: 1px 6px;
  border-radius: 12px;
  align-self: flex-start;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

.collection-type.feature {
  background-color: #e3f2fd;
  color: #1976d2;
}

.collection-type.coverage {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.collection-type.tile {
  background-color: #e8f5e9;
  color: #388e3c;
}

.collection-type.record {
  background-color: #fff3e0;
  color: #f57c00;
}

.collection-type.unknown {
  background-color: #f5f5f5;
  color: #757575;
}

.collection-item.active .collection-type.feature {
  background-color: rgba(25, 118, 210, 0.15);
  color: #1976d2;
}

.collection-item.active .collection-type.coverage {
  background-color: rgba(123, 31, 162, 0.15);
  color: #7b1fa2;
}

.collection-item.active .collection-type.tile {
  background-color: rgba(56, 142, 60, 0.15);
  color: #388e3c;
}

.collection-item.active .collection-type.record {
  background-color: rgba(245, 124, 0, 0.15);
  color: #f57c00;
}

.collection-item.active .collection-type.unknown {
  background-color: rgba(117, 117, 117, 0.15);
  color: #757575;
}

/* RTL Support */
[dir="rtl"] .sidebar {
  left: auto;
  right: 0;
  border-right: none;
  border-left: 1px solid var(--border-color);
}

[dir="rtl"] .collection-item.active {
  border-left: none;
  border-right: 4px solid var(--primary-color);
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .sidebar {
    position: relative;
    width: 100%;
    height: 300px;
    min-height: 300px;
  }

  .sidebar.sidebar-collapsed {
    height: 40px;
    min-height: 40px;
  }

  .collection-item {
    padding: 12px;
  }

  .collection-title {
    font-size: 14px;
  }

  .collections-header {
    padding: 8px;
  }

  .header-content {
    gap: 8px;
  }

  .header-content h2 {
    font-size: 1rem;
  }

  .search-container {
    width: 100px;
  }

  .search-container:focus-within {
    width: 130px;
  }

  .search-input {
    padding: 2px 18px 2px 5px;
    font-size: 11px;
    height: 20px;
  }

  .search-icon {
    right: 4px;
    font-size: 10px;
  }

  [dir="rtl"] .search-input {
    padding: 2px 5px 2px 18px;
  }

  [dir="rtl"] .search-icon {
    right: auto;
    left: 4px;
  }
}

/* Collapsed state */
.sidebar-collapsed .collections-header {
  padding: 12px 6px;
}

.sidebar-collapsed .header-content {
  justify-content: center;
}

.sidebar-collapsed .search-container,
.sidebar-collapsed h2 {
  display: none;
}

.empty-state {
  padding: 24px;
  text-align: center;
  color: var(--text-muted);
}
</style>
