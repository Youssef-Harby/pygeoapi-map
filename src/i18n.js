import { createI18n } from 'vue-i18n'
import config from './config.json'

// Import base language synchronously
import enUS from './locales/en-US.json'
import arEG from './locales/ar-EG.json'

const messages = {
  'en-US': enUS,
  'ar-EG': arEG
}

// Create i18n instance
const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: config.i18n.defaultLocale,
  fallbackLocale: config.i18n.fallbackLocale,
  messages,
  // Special handling for RTL languages
  watcher: {
    'locale': (val) => {
      const html = document.querySelector('html')
      const isRTL = config.i18n.supportedLocales.find(locale => locale.code === val)?.direction === 'rtl'
      // Set direction attribute
      html.setAttribute('dir', isRTL ? 'rtl' : 'ltr')
      // Set language attribute (only 2-letter code)
      html.setAttribute('lang', val.split('-')[0])
    }
  }
})

// Function to load locale messages dynamically
export async function loadLocaleMessages(locale) {
  // Skip if locale is already loaded or is one of our base locales
  if (i18n.global.availableLocales.includes(locale) || locale === 'en-US' || locale === 'ar-EG') {
    return
  }

  try {
    // Dynamic import of locale files
    const messages = await import(
      /* webpackChunkName: "locale-[request]" */
      `./locales/${locale}.json`
    )
    // Set the locale messages
    i18n.global.setLocaleMessage(locale, messages.default)
  } catch (error) {
    console.error(`Failed to load locale ${locale}:`, error)
    // Fallback to default locale
    return i18n.global.locale.value = config.i18n.fallbackLocale
  }
}

export default i18n
