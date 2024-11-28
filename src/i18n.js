import { createI18n } from 'vue-i18n'
import config from './config.json'

// Import base languages synchronously
import en from './locales/en.json'
import ar from './locales/ar.json'

// Get initial locale with priority
const getInitialLocale = () => {
  const storedLocale = localStorage.getItem('pygeoapi_locale')
  // Verify if stored locale is supported
  if (storedLocale && config.i18n.supportedLocales.some(l => l.code === storedLocale)) {
    return storedLocale
  }
  return config.i18n.defaultLocale || 'en'
}

// Initialize locale and direction
const initialLocale = getInitialLocale()
const initialDirection = config.i18n.supportedLocales.find(l => l.code === initialLocale)?.direction || 'ltr'

// Set initial HTML attributes
document.documentElement.lang = initialLocale
document.documentElement.dir = initialDirection

const messages = {
  'en': en,
  'ar': ar
}

// Create i18n instance
const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: initialLocale,
  fallbackLocale: config.i18n.fallbackLocale || 'en',
  messages,
  // Special handling for RTL languages
  watcher: {
    'locale': (val) => {
      const isRTL = config.i18n.supportedLocales.find(locale => locale.code === val)?.direction === 'rtl'
      // Set direction attribute
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
      // Set language attribute
      document.documentElement.lang = val
      // Store in localStorage
      localStorage.setItem('pygeoapi_locale', val)
    }
  }
})

// Function to load locale messages dynamically
export async function loadLocaleMessages(locale) {
  // Skip if locale is already loaded or is one of our base locales
  if (i18n.global.availableLocales.includes(locale) || locale === 'en' || locale === 'ar') {
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
