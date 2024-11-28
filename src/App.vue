<template>
  <div id="app" :class="{ 'rtl': isRTL }">
    <Header />
    <main class="main-content">
      <Sidebar />
      <MapView />
    </main>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import { computed } from 'vue'
import { useStore } from 'vuex'
import Header from '@/components/Header.vue'
import Sidebar from '@/components/Sidebar.vue'
import MapView from '@/components/MapView.vue'
import config from './config.json'

export default {
  name: 'App',
  components: {
    Header,
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
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.rtl {
  direction: rtl;
}

/* Responsive styles */
@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }

  .sidebar {
    max-height: 40vh;
  }
}
</style>
