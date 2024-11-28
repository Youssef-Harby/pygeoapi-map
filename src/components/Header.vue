<template>
  <header class="header">
    <h1 class="title">{{ $t('app.title') }}</h1>
    
    <div class="server-selector">
      <div class="server-display" @click="showServerInput = !showServerInput">
        <span>{{ currentServer }}</span>
        <button class="edit-button" title="Edit Server URL">
          <i class="fas fa-edit"></i>
        </button>
      </div>
      <div v-if="showServerInput" class="server-input-container">
        <input 
          v-model="tempServerUrl" 
          type="text" 
          @keyup.enter="updateServer"
          :placeholder="$t('server.placeholder')"
        />
        <button @click="updateServer" class="apply-button">
          {{ $t('common.apply') }}
        </button>
      </div>
    </div>

    <div class="language-container">
      <select :value="locale" @change="onLocaleChange($event.target.value)" class="language-select">
        <option 
          v-for="locale in supportedLocales" 
          :key="locale.code" 
          :value="locale.code"
        >
          {{ locale.flag }} {{ locale.name }}
        </option>
      </select>
    </div>
  </header>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import { ref, onMounted, watch } from 'vue'
import config from '@/config.json'

export default {
  name: 'Header',
  setup() {
    const showServerInput = ref(false)
    const tempServerUrl = ref('')

    onMounted(() => {
      // Initialize tempServerUrl with the current store value
      const storedUrl = localStorage.getItem('pygeoapi_server_url')
      const envUrl = import.meta.env?.VITE_PYGEOAPI_SERVER_URL
      tempServerUrl.value = storedUrl || envUrl || config.server.url
    })

    return {
      showServerInput,
      tempServerUrl
    }
  },
  computed: {
    ...mapState(['locale', 'serverUrl']),
    ...mapGetters(['supportedLocales']),
    currentServer() {
      return this.serverUrl || config.server.url
    }
  },
  methods: {
    ...mapActions(['changeLocale', 'updateServerUrl']),
    onLocaleChange(newLocale) {
      if (newLocale !== this.locale) {
        this.changeLocale(newLocale)
      }
    },
    async updateServer() {
      try {
        if (this.tempServerUrl && this.tempServerUrl !== this.currentServer) {
          await this.updateServerUrl(this.tempServerUrl.trim())
        }
      } catch (error) {
        console.error('Error updating server:', error)
      } finally {
        this.showServerInput = false
      }
    }
  },
  watch: {
    serverUrl: {
      immediate: true,
      handler(newUrl) {
        if (newUrl && newUrl !== this.tempServerUrl) {
          this.tempServerUrl = newUrl
        }
      }
    }
  }
}
</script>

<style>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.title {
  margin: 0;
  font-size: 1.5rem;
  color: #343a40;
}

.server-selector {
  position: relative;
  min-width: 300px;
}

.server-display {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  cursor: pointer;
  background-color: white;
}

.server-display span {
  flex: 1;
  margin-right: 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.edit-button {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 0.25rem;
}

.edit-button:hover {
  color: #343a40;
}

.server-input-container {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.25rem;
  padding: 0.5rem;
  background-color: white;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 1000;
  display: flex;
  gap: 0.5rem;
}

.server-input-container input {
  flex: 1;
  padding: 0.375rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  font-size: 1rem;
}

.apply-button {
  padding: 0.375rem 0.75rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.apply-button:hover {
  background-color: #0056b3;
}

.language-container {
  margin-left: 1rem;
}

.language-select {
  padding: 0.375rem 2rem 0.375rem 0.75rem;
  font-size: 1rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  background-color: white;
  cursor: pointer;
}

.language-select:focus {
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0,123,255,0.25);
}
</style>
