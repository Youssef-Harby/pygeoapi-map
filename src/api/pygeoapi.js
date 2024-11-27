import axios from 'axios'

const API_BASE_URL = 'https://demo.pygeoapi.io/master'

const api = axios.create({
  baseURL: API_BASE_URL,
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

export async function fetchCollections() {
  try {
    console.log('Fetching collections')
    const response = await api.get('/collections')
    return response.data.collections || []
  } catch (error) {
    console.error('Error fetching collections:', error)
    throw error
  }
}

export async function fetchCollectionDetails(collectionId) {
  try {
    console.log('Fetching collection details:', collectionId)
    const response = await api.get(`/collections/${collectionId}`)
    return response.data
  } catch (error) {
    console.error(`Error fetching collection details for ${collectionId}:`, error)
    throw error
  }
}

export async function fetchFeatures(collectionId, params = {}) {
  try {
    // Handle OGC API Features parameters
    const queryParams = {
      ...params,
      // Add default limit if not specified
      limit: params.limit || 1000,
      // Handle bbox if provided
      ...(params.bbox && { bbox: params.bbox.join(',') }),
      // Handle datetime if provided
      ...(params.datetime && { datetime: params.datetime }),
      // Handle properties if provided
      ...(params.properties && { properties: params.properties.join(',') }),
      // Handle skipGeometry parameter
      ...(params.skipGeometry !== undefined && { skipGeometry: params.skipGeometry }),
    }

    console.log('Fetching features:', { collectionId, params: queryParams })
    const response = await api.get(`/collections/${collectionId}/items`, { params: queryParams })
    return response.data
  } catch (error) {
    console.error(`Error fetching features for ${collectionId}:`, error)
    throw error
  }
}

export async function fetchCollectionQueryables(collectionId) {
  try {
    console.log('Fetching queryables:', collectionId)
    const response = await api.get(`/collections/${collectionId}/queryables`)
    return response.data
  } catch (error) {
    console.error(`Error fetching queryables for ${collectionId}:`, error)
    throw error
  }
}

export function getWMSUrl(collectionId) {
  return `${API_BASE_URL}/collections/${collectionId}/coverage/wms`
}

export function getTileUrl(collectionId, format = 'mvt') {
  const path = format === 'mvt' 
    ? `/collections/${collectionId}/tiles/WebMercatorQuad/{z}/{x}/{y}` 
    : `/collections/${collectionId}/tiles/{z}/{x}/{y}`
  return `${API_BASE_URL}${path}`
}

export async function fetchTileSetInfo(collectionId) {
  try {
    console.log('Fetching tile set info:', collectionId)
    const response = await api.get(`/collections/${collectionId}/tiles`)
    return response.data
  } catch (error) {
    console.error(`Error fetching tile set info for ${collectionId}:`, error)
    throw error
  }
}

export function getCollectionRenderType(collection) {
  console.log('Determining render type for collection:', collection)
  
  // Check for features endpoint
  if (collection.links?.some(link => 
    link.rel === 'items' || 
    link.href?.includes('/items')
  )) {
    console.log('Detected feature collection')
    return 'feature'
  }

  // Check for coverage endpoint
  if (collection.links?.some(link => 
    link.rel === 'coverage' || 
    link.href?.includes('/coverage')
  )) {
    console.log('Detected coverage collection')
    return 'coverage'
  }

  // Check for tiles endpoint
  if (collection.links?.some(link => 
    link.rel === 'tiles' || 
    link.href?.includes('/tiles')
  )) {
    console.log('Detected tile collection')
    return 'tiles'
  }

  console.warn('Unknown collection type')
  return 'unknown'
}
