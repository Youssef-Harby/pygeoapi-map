<template>
  <div class="sidebar">
    <div class="header">
      <h2>{{ $t('collections.title') }}</h2>
      <LanguageSelector />
    </div>
    <div class="collections-list">
      <div v-if="loading" class="loading">
        {{ $t('common.loading') }}
      </div>
      <div v-else-if="error" class="error">
        {{ $t('common.error') }}
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
import LanguageSelector from './LanguageSelector.vue'

export default {
  name: 'Sidebar',
  components: {
    LanguageSelector
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
  background: white;
  border-right: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.header {
  padding: 15px;
  border-bottom: 1px solid #ddd;
  background: #f5f5f5;
}

.header h2 {
  margin: 0 0 10px 0;
  font-size: 1.2em;
  color: #333;
}

.collections-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.collection-item {
  padding: 10px 10px 10px 15px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
}

.collection-item:hover {
  background-color: #f8f9fa;
}

.collection-toggle {
  display: flex;
  align-items: center;
  margin-right: 10px;
  cursor: pointer;
}

.collection-toggle input {
  margin-right: 8px;
}

.collection-title {
  font-size: 0.9em;
  color: #333;
  flex: 1;
}

.collection-type {
  font-size: 0.8em;
  padding: 2px 6px;
  border-radius: 3px;
  background: #e9ecef;
  color: #495057;
  margin-left: auto;
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

.loading, .error {
  padding: 15px;
  text-align: center;
  color: #666;
}

.error {
  color: #dc3545;
}

/* RTL Specific Styles */
:dir(rtl) .collection-toggle input {
  margin-right: 0;
  margin-left: 8px;
}

:dir(rtl) .collection-type {
  margin-left: 0;
  margin-right: auto;
}
</style>
