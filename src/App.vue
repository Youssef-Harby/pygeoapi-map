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
:root {
  --header-height: 60px;
  --sidebar-width: 360px;
  --sidebar-collapsed-width: 60px;
  --border-color: #e2e8f0;
  --bg-color: #f8f9fa;
  --text-color: #2c3e50;
  --text-muted: #6c757d;
  --primary-color: #007bff;
  --hover-bg: #e9ecef;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

#app {
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.main-content {
  flex: 1;
  position: relative;
  height: calc(100vh - var(--header-height));
  overflow: hidden;
}

/* RTL Support */
.rtl {
  direction: rtl;
  text-align: right;
}

@media (max-width: 768px) {
  .main-content {
    display: flex;
    flex-direction: column;
  }
}
</style>
