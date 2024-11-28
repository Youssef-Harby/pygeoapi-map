import { createI18n } from 'vue-i18n'

// Import base languages synchronously
import enUS from './locales/en-US.json'
import arEG from './locales/ar-EG.json'

// Get initial locale with priority
const getInitialLocale = () => {
  const storedLocale = localStorage.getItem('pygeoapi_locale')
  return storedLocale || 'en-US'
}

// Initialize locale
const initialLocale = getInitialLocale()

// Set initial HTML attributes
document.documentElement.lang = initialLocale
document.documentElement.dir = 'ltr' // Default to LTR, will be updated when config is loaded

const messages = {
  'en-US': enUS,
  'ar-EG': arEG
}

// Create i18n instance
const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'en-US',
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
    console.error(`Could not load locale messages for ${locale}:`, error)
  }
}

// Watch for locale changes
i18n.global.locale.value = initialLocale

export default i18n
