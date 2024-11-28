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
            @click="toggleCollection(collection.id)"
          >
            <div class="collection-info">
              <div class="collection-header">
                <h3 class="collection-title">{{ collection.title || collection.id }}</h3>
                <button 
                  class="toggle-button"
                  :class="{ active: isCollectionActive(collection.id) }"
                  @click.stop="toggleCollection(collection.id)"
                >
                  <i class="fas" :class="isCollectionActive(collection.id) ? 'fa-eye-slash' : 'fa-eye'"></i>
                </button>
              </div>
              <span class="collection-type" :class="getCollectionType(collection)">
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

    const filteredCollections = computed(() => {
      if (!searchQuery.value) return collections.value
      const query = searchQuery.value.toLowerCase()
      return collections.value.filter(collection => 
        (collection.title?.toLowerCase().includes(query) || 
         collection.id?.toLowerCase().includes(query))
      )
    })

    const toggleSidebar = () => {
      isCollapsed.value = !isCollapsed.value
    }

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
      toggleSidebar,
      toggleCollection,
      retryFetch,
      getCollectionType
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
  padding: 12px;
  border-bottom: 1px solid var(--border-color);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-content h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
}

.search-container {
  position: relative;
  width: 120px;
  min-width: 0;
  transition: width 0.2s ease;
}

.search-container:focus-within {
  width: 150px;
}

.search-input {
  width: 100%;
  padding: 2px 20px 2px 6px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 12px;
  outline: none;
  transition: all 0.2s ease;
  background-color: white;
  height: 22px;
}

.search-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
}

.search-icon {
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
  font-size: 11px;
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
}

.collection-item {
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.collection-item:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transform: translateY(-1px);
  z-index: 2;
}

.collection-item.active {
  background-color: var(--bg-color);
  border-left: 4px solid var(--primary-color);
}

.collection-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.collection-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  min-height: 24px;
}

.collection-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  transition: all 0.3s ease;
  line-height: 1.4;
}

.collection-item:hover .collection-title {
  white-space: normal;
  overflow: visible;
}

.toggle-button {
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  color: var(--text-muted);
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.toggle-button:hover {
  background-color: var(--hover-bg);
  color: var(--text-color);
}

.toggle-button.active {
  color: var(--primary-color);
  background-color: rgba(0,123,255,0.1);
}

.collection-type {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 12px;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
  align-self: flex-start;
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

/* RTL Support */
[dir="rtl"] .sidebar {
  left: auto;
  right: 0;
  border-right: none;
  border-left: 1px solid var(--border-color);
}

[dir="rtl"] .search-input {
  padding: 2px 6px 2px 20px;
}

[dir="rtl"] .search-icon {
  right: auto;
  left: 5px;
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

  .toggle-button {
    padding: 4px;
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
</style>
