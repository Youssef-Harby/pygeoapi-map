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
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  position: sticky;
  top: 0;
  z-index: 1000;
  flex-wrap: wrap;
  gap: 1rem;
}

.title {
  margin: 0;
  font-size: clamp(1.2rem, 2vw, 1.5rem);
  color: #343a40;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.server-selector {
  position: relative;
  flex: 1;
  min-width: 200px;
  max-width: 500px;
}

.server-display {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
  cursor: pointer;
  background-color: white;
  transition: all 0.2s ease;
}

.server-display:hover {
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0,123,255,0.1);
}

.server-display span {
  flex: 1;
  margin-right: 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.9rem;
}

.edit-button {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 0.25rem;
  transition: color 0.2s ease;
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
  padding: 0.75rem;
  background-color: white;
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  z-index: 1000;
  display: flex;
  gap: 0.5rem;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.server-input-container input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.server-input-container input:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0,123,255,0.1);
}

.apply-button {
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  white-space: nowrap;
}

.apply-button:hover {
  background-color: #0056b3;
  transform: translateY(-1px);
}

.apply-button:active {
  transform: translateY(0);
}

.language-container {
  position: relative;
  margin-left: auto;
}

.language-select {
  padding: 0.5rem 2.5rem 0.5rem 1rem;
  font-size: 0.9rem;
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
  background-color: white;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M3.879 4.515L6 6.636l2.121-2.121.707.707L6 8.05 3.172 5.222z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 0.75rem;
  transition: all 0.2s ease;
}

.language-select:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0,123,255,0.1);
}

.language-select:hover {
  border-color: #80bdff;
}

/* RTL Support */
[dir="rtl"] .header {
  direction: rtl;
}

[dir="rtl"] .server-display span {
  margin-right: 0;
  margin-left: 0.5rem;
}

[dir="rtl"] .language-select {
  padding: 0.5rem 1rem 0.5rem 2.5rem;
  background-position: left 1rem center;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header {
    padding: 0.75rem;
  }

  .title {
    width: 100%;
    text-align: center;
    margin-bottom: 0.5rem;
  }

  .server-selector {
    order: 2;
    min-width: 0;
    flex: 1;
  }

  .language-container {
    order: 1;
    margin-left: 0;
  }

  .server-display span {
    font-size: 0.85rem;
  }

  .language-select {
    padding: 0.5rem 2rem 0.5rem 0.75rem;
  }
}

@media (max-width: 480px) {
  .header {
    gap: 0.5rem;
  }

  .server-display {
    padding: 0.5rem;
  }

  .server-input-container {
    padding: 0.5rem;
  }

  .apply-button {
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
  }
}
</style>
