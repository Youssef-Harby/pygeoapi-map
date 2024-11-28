import { createI18n } from 'vue-i18n'
import config from './config.json'

// Import base languages synchronously
import enUS from './locales/en-US.json'
import arEG from './locales/ar-EG.json'

// Get initial locale with priority
const getInitialLocale = () => {
  const storedLocale = localStorage.getItem('pygeoapi_locale')
  // Verify if stored locale is supported
  if (storedLocale && config.i18n.supportedLocales.some(l => l.code === storedLocale)) {
    return storedLocale
  }
  return config.i18n.defaultLocale || 'en-US'
}

// Initialize locale and direction
const initialLocale = getInitialLocale()
const initialDirection = config.i18n.supportedLocales.find(l => l.code === initialLocale)?.direction || 'ltr'

// Set initial HTML attributes
document.documentElement.lang = initialLocale
document.documentElement.dir = initialDirection

const messages = {
  'en-US': enUS,
  'ar-EG': arEG
}

// Create i18n instance
const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: config.i18n.fallbackLocale,
  messages,
  globalInjection: true,
  warnHtmlMessage: false
})

// Function to load locale messages dynamically
export async function loadLocaleMessages(locale) {
  // Already loaded
  if (i18n.global.availableLocales.includes(locale)) {
    return
  }

  try {
    const messages = await import(`./locales/${locale}.json`)
    i18n.global.setLocaleMessage(locale, messages.default)
  } catch (error) {
    console.error(`Failed to load locale ${locale}:`, error)
  }
}

// Watch for locale changes
i18n.global.locale.value = initialLocale

export default i18n
