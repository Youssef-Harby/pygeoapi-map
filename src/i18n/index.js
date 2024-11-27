import { createI18n } from 'vue-i18n'

const messages = {
  en: {
    collections: 'Collections',
    layers: 'Layers',
    noCollections: 'No collections available',
    toggleLayer: 'Toggle Layer'
  },
  ar: {
    collections: 'المجموعات',
    layers: 'الطبقات',
    noCollections: 'لا توجد مجموعات متاحة',
    toggleLayer: 'تبديل الطبقة'
  }
}

export default createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages,
})
