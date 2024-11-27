<template>
  <div id="app" :class="{ 'rtl': isRTL }">
    <Sidebar />
    <MapView />
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import { computed } from 'vue'
import { useStore } from 'vuex'
import Sidebar from '@/components/Sidebar.vue'
import MapView from '@/components/MapView.vue'
import config from './config.json'

export default {
  name: 'App',
  components: {
    Sidebar,
    MapView
  },
  setup() {
    const store = useStore()
    
    const isRTL = computed(() => {
      const currentLocale = store.getters.currentLocale
      return config.i18n.supportedLocales.find(locale => locale.code === currentLocale)?.direction === 'rtl'
    })

    return {
      isRTL
    }
  },
  mounted() {
    this.fetchCollections()
  },
  methods: {
    ...mapActions(['fetchCollections'])
  }
}
</script>

<style>
body, html {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: Arial, sans-serif;
}

#app {
  display: flex;
  height: 100vh;
  width: 100vw;
  position: absolute;
  top: 0;
  left: 0;
}

#app.rtl {
  direction: rtl;
}

/* RTL specific styles */
.rtl .sidebar {
  border-right: none;
  border-left: 1px solid #ddd;
}

.rtl .collection-item {
  padding: 10px 15px 10px 10px;
}

.rtl .collection-toggle {
  margin-right: 0;
  margin-left: 10px;
}

.rtl .collection-type {
  margin-left: 0;
  margin-right: auto;
}
</style>
