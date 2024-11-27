<template>
  <div class="language-selector" :class="{ 'is-rtl': isRTL }">
    <ul class="language-list">
      <li 
        v-for="locale in supportedLocales" 
        :key="locale.code"
        :class="{ active: currentLocale === locale.code }"
        @click="changeLocale(locale.code)"
      >
        <span class="flag">{{ locale.flag }}</span>
        <span class="name">{{ locale.name }}</span>
      </li>
    </ul>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'

export default {
  name: 'LanguageSelector',
  setup() {
    const store = useStore()
    const { locale } = useI18n()
    
    const currentLocale = computed(() => store.getters.currentLocale)
    const supportedLocales = computed(() => store.getters.supportedLocales)
    const isRTL = computed(() => {
      const current = supportedLocales.value.find(l => l.code === currentLocale.value)
      return current?.direction === 'rtl'
    })

    const changeLocale = (code) => {
      store.dispatch('changeLocale', code)
    }

    return {
      currentLocale,
      supportedLocales,
      isRTL,
      changeLocale
    }
  }
}
</script>

<style scoped>
.language-selector {
  margin: 1rem;
}

.language-list {
  list-style: none;
  padding: 0;
  margin: 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.language-list li {
  padding: 0.75rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  transition: background-color 0.2s;
}

.language-list li:hover {
  background-color: #f5f5f5;
}

.language-list li.active {
  background-color: #e3f2fd;
  font-weight: 500;
}

.flag {
  font-size: 1.2em;
}

.name {
  font-size: 0.9em;
}

/* RTL Support */
.is-rtl .language-list li {
  flex-direction: row-reverse;
}
</style>
