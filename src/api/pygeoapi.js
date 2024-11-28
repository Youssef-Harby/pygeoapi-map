import axios from 'axios'
import config from '@/config.json'

// Create axios instance with dynamic base URL
const api = axios.create({
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add request interceptor for logging
api.interceptors.request.use(config => {
  console.log('API Request:', {
    method: config.method,
    url: config.url,
    params: config.params,
    data: config.data
  })
  return config
})

// Add response interceptor for logging
api.interceptors.response.use(
  response => {
    console.log('API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    })
    return response
  },
  error => {
    console.error('API Error:', {
      message: error.message,
      config: error.config,
      response: error.response?.data
    })
    return Promise.reject(error)
  }
)

// Helper function to get language query parameter
function getLanguageParam(locale) {
  const localeConfig = config.i18n.supportedLocales.find(l => l.code === locale)
  return localeConfig?.queryParam || ''
}

// Helper function to build URL with language parameter
function buildUrl(baseUrl, path, locale) {
  const langParam = getLanguageParam(locale)
  const url = `${baseUrl.replace(/\/$/, '')}${path}`
  return langParam ? `${url}${langParam}` : url
}

export async function fetchCollections(serverUrl, locale) {
  try {
    console.log('Fetching collections from:', serverUrl)
    const response = await api.get(buildUrl(serverUrl, '/collections', locale))
    if (!response.data?.collections) {
      throw new Error('No collections found in response')
    }
    return response.data.collections
  } catch (error) {
    console.error('Error fetching collections:', error)
    throw new Error(`Failed to fetch collections: ${error.message}`)
  }
}

export async function fetchCollectionDetails(serverUrl, collectionId, locale) {
  try {
    const url = buildUrl(serverUrl, `/collections/${collectionId}`, locale)
    const response = await api.get(url)
    return response.data
  } catch (error) {
    console.error(`Error fetching collection ${collectionId} details:`, error)
    throw error
  }
}

export async function fetchFeatures(serverUrl, collectionId, params = {}, locale) {
  try {
    const url = buildUrl(serverUrl, `/collections/${collectionId}/items`, locale)
    const response = await api.get(url, { params })
    return response.data
  } catch (error) {
    console.error(`Error fetching features for collection ${collectionId}:`, error)
    throw error
  }
}

export async function fetchCollectionQueryables(serverUrl, collectionId, locale) {
  try {
    const url = buildUrl(serverUrl, `/collections/${collectionId}/queryables`, locale)
    const response = await api.get(url)
    return response.data
  } catch (error) {
    console.error(`Error fetching queryables for collection ${collectionId}:`, error)
    throw error
  }
}

export function getWMSUrl(serverUrl, collectionId, locale) {
  return buildUrl(serverUrl, `/collections/${collectionId}/wms`, locale)
}

export function getTileUrl(serverUrl, collectionId, format = 'mvt', locale) {
  return buildUrl(serverUrl, `/collections/${collectionId}/tiles/${format}`, locale)
}

export async function fetchTileSetInfo(serverUrl, collectionId, locale) {
  try {
    const url = buildUrl(serverUrl, `/collections/${collectionId}/tiles`, locale)
    const response = await api.get(url)
    return response.data
  } catch (error) {
    console.error(`Error fetching tile set info for collection ${collectionId}:`, error)
    throw error
  }
}

export function getCollectionRenderType(collection) {
  if (!collection) {
    console.warn('No collection provided to getCollectionRenderType')
    return 'unknown'
  }

  // Check links for specific capabilities
  const links = collection.links || []
  const hasWMS = links.some(link => link.rel === 'wms')
  const hasTiles = links.some(link => link.rel === 'tiles')
  const hasItems = links.some(link => link.rel === 'items')

  // Check collection type and links
  if (collection.itemType === 'coverage' || hasWMS) {
    return 'coverage'
  } else if (hasTiles) {
    return 'tile'
  } else if (collection.itemType === 'record') {
    return 'record'
  } else if (hasItems || collection.itemType === 'feature') {
    return 'feature'
  }

  // Log warning for unknown collection type
  console.warn('Unknown collection type:', {
    itemType: collection.itemType,
    links: links.map(l => ({ rel: l.rel, type: l.type }))
  })

  return 'unknown'
}
