<template>
  <div id="app" :class="{ 'rtl': $i18n.locale === 'ar' }">
    <Sidebar />
    <MapView />
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import Sidebar from '@/components/Sidebar.vue'
import MapView from '@/components/MapView.vue'

export default {
  name: 'App',
  components: {
    Sidebar,
    MapView
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
</style>
