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
  if (!collection) return 'unknown'

  // Check for record collection with GeoJSON items
  if (collection.itemType === 'record' && collection.links) {
    const hasGeoJSONItems = collection.links.some(link => 
      (link.rel === 'items' && link.type === 'application/geo+json') ||
      (link.rel === 'items' && link.type === 'application/json')
    )
    if (hasGeoJSONItems) return 'record'
  }

  // Check for coverage collection
  if (collection.itemType === 'coverage' || 
      (collection.links && collection.links.some(link => 
        link.rel === 'coverage' || 
        link.type?.includes('coverage')))) {
    return 'coverage'
  }

  // Check for tile collection
  if (collection.itemType === 'tile' || 
      (collection.links && collection.links.some(link => 
        link.rel === 'tiles' || 
        link.type?.includes('mvt')))) {
    return 'tile'
  }

  // Check for feature collection
  if (collection.itemType === 'feature' || 
      (collection.links && collection.links.some(link => 
        link.rel === 'items' && 
        (link.type === 'application/geo+json' || 
         link.type === 'application/json')))) {
    return 'feature'
  }

  // Default to record type
  if (collection.itemType === 'record') {
    return 'record'
  }

  return 'unknown'
}
