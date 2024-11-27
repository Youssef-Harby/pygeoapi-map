<template>
  <div class="sidebar">
    <div class="header">
      <h2>{{ $t('collections.title') }}</h2>
      <LanguageSwitcher />
    </div>
    <div class="collections-list">
      <div v-if="loading" class="loading">
        {{ $t('common.loading') }}
      </div>
      <div v-else-if="error" class="error">
        {{ error }}
      </div>
      <template v-else>
        <div
          v-for="collection in collections"
          :key="collection.id"
          class="collection-item"
          @click="handleCollectionClick(collection)"
        >
          <label class="collection-toggle">
            <input
              type="checkbox"
              :checked="isCollectionActive(collection.id)"
              @change="handleToggle(collection)"
            />
            <span class="collection-title">{{ collection.title || collection.id }}</span>
          </label>
          <div class="collection-type" :class="collection.itemType">
            {{ collection.itemType }}
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import LanguageSwitcher from './LanguageSwitcher.vue'

export default {
  name: 'Sidebar',
  components: {
    LanguageSwitcher
  },
  computed: {
    ...mapState(['collections', 'loading', 'error']),
    ...mapGetters(['isCollectionActive'])
  },
  methods: {
    ...mapActions(['fetchCollections', 'toggleCollection']),
    handleCollectionClick(collection) {
      console.log('Collection clicked:', {
        id: collection.id,
        title: collection.title,
        type: collection.itemType,
        wasActive: this.isCollectionActive(collection.id)
      })
    },
    handleToggle(collection) {
      console.log('Toggle requested for collection:', {
        id: collection.id,
        title: collection.title,
        type: collection.itemType,
        wasActive: this.isCollectionActive(collection.id)
      })
      this.toggleCollection(collection.id)
    }
  },
  mounted() {
    console.log('Sidebar mounted, fetching collections')
    this.fetchCollections()
  }
}
</script>

<style>
.sidebar {
  width: 300px;
  background: #f5f5f5;
  border-right: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header {
  padding: 1rem;
  border-bottom: 1px solid #ddd;
}

.header h2 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
}

.collections-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.collection-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s;
  cursor: pointer;
}

.collection-item:hover {
  background-color: #eee;
}

.collection-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.collection-title {
  font-size: 0.9rem;
  margin-left: 0.5rem;
}

.collection-type {
  font-size: 0.8rem;
  padding: 0.2rem 0.5rem;
  border-radius: 3px;
  background: #e0e0e0;
  color: #666;
}

.collection-type.feature {
  background: #e3f2fd;
  color: #1976d2;
}

.collection-type.coverage {
  background: #e8f5e9;
  color: #388e3c;
}

.collection-type.tile {
  background: #fff3e0;
  color: #f57c00;
}

.loading {
  padding: 1rem;
  text-align: center;
  color: #666;
}

.error {
  padding: 1rem;
  color: #d32f2f;
  text-align: center;
}
</style>
