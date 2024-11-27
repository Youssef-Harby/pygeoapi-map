<template>
  <div class="language-switcher">
    <button @click="switchLanguage('en')" :class="{ active: currentLocale === 'en' }">English</button>
    <button @click="switchLanguage('ar')" :class="{ active: currentLocale === 'ar' }">العربية</button>
  </div>
</template>

<script>
export default {
  name: 'LanguageSwitcher',
  computed: {
    currentLocale() {
      return this.$i18n.locale
    }
  },
  methods: {
    switchLanguage(lang) {
      this.$i18n.locale = lang
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.lang = lang
    }
  }
}
</script>

<style scoped>
.language-switcher {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.language-switcher button {
  padding: 8px 16px;
  cursor: pointer;
  border: 1px solid #ddd;
  background-color: white;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.language-switcher button.active {
  background-color: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.language-switcher button:hover {
  background-color: #f0f0f0;
}

.language-switcher button.active:hover {
  background-color: #45a049;
}
</style>
