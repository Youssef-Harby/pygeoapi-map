<template>
  <div class="map-container">
    <div id="map"></div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { initLeafletIcons } from '@/utils/leaflet'
import {
  fetchCollectionDetails,
  fetchFeatures,
  getWMSUrl,
  getTileUrl,
  getVectorTileUrl,
  fetchCollectionQueryables,
  fetchTileSetInfo,
  getCollectionRenderType
} from '@/api/pygeoapi'

export default {
  name: 'MapView',
  data() {
    return {
      map: null,
      layerGroups: {},
      layerColors: {},
      layerBounds: {},
      isInitialized: false
    }
  },
  computed: {
    ...mapState(['collections', 'activeCollections']),
    activeCollectionObjects() {
      console.log('Computing active collection objects:', {
        activeIds: this.activeCollections,
        allCollections: this.collections
      })
      return this.collections.filter(c => this.activeCollections.includes(c.id))
    }
  },
  mounted() {
    console.log('MapView mounted')
    initLeafletIcons()
    this.initMap()
  },
  methods: {
    initMap() {
      console.log('MapView - Initializing map')
      if (this.isInitialized) return

      this.$nextTick(() => {
        try {
          this.map = L.map('map').setView([0, 0], 2)
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: ' OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(this.map)

          this.map.on('moveend', () => {
            console.log('MapView - Map moved:', {
              center: this.map.getCenter(),
              zoom: this.map.getZoom()
            })
          })

          // Make sure map is properly sized
          setTimeout(() => {
            if (this.map) {
              this.map.invalidateSize()
              this.isInitialized = true
            }
          }, 200)
        } catch (error) {
          console.error('Error initializing map:', error)
        }
      })
    },
    async loadCollectionLayer(collection) {
      if (!this.map || !this.isInitialized) {
        console.warn('Map not initialized yet, retrying in 200ms')
        setTimeout(() => this.loadCollectionLayer(collection), 200)
        return
      }

      try {
        console.log('MapView - Loading collection:', collection.id)
        
        // Create or get layer group
        if (!this.layerGroups[collection.id]) {
          this.layerGroups[collection.id] = L.layerGroup()
        }
        const layerGroup = this.layerGroups[collection.id]
        const color = this.getCollectionColor(collection.id)

        // Clear existing layers
        layerGroup.clearLayers()

        // Get collection details and determine render type
        const details = await fetchCollectionDetails(collection.id)
        const renderType = getCollectionRenderType(details)
        console.log('MapView - Collection type:', renderType)

        // Handle different collection types
        switch (renderType) {
          case 'feature':
            await this.handleFeatureCollection(collection, layerGroup, color)
            break
          case 'coverage':
            await this.handleCoverageCollection(collection, layerGroup)
            break
          case 'tiles':
            await this.handleTileCollection(collection, layerGroup)
            break
          default:
            console.warn(`MapView - Unknown collection type: ${renderType}`)
        }

        // Add layer group to map if not already added
        if (!this.map.hasLayer(layerGroup)) {
          layerGroup.addTo(this.map)
        }

      } catch (error) {
        console.error(`MapView - Error loading collection ${collection.id}:`, error)
      }
    },
    async handleFeatureCollection(collection, layerGroup, color) {
      try {
        const queryables = await fetchCollectionQueryables(collection.id)
        const featuresData = await fetchFeatures(collection.id, { limit: 1000 })
        
        if (featuresData.features?.length > 0) {
          const geoJsonLayer = L.geoJSON(featuresData.features, {
            style: (feature) => ({
              color: color,
              weight: 2,
              opacity: 0.8,
              fillOpacity: 0.35
            }),
            pointToLayer: (feature, latlng) => {
              return L.circleMarker(latlng, {
                radius: 8,
                fillColor: color,
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
              })
            },
            onEachFeature: (feature, layer) => {
              if (feature.properties) {
                const popupContent = this.createPopupContent(feature.properties, queryables)
                layer.bindPopup(popupContent, {
                  maxWidth: 300,
                  closeButton: true,
                  autoPan: true
                })
              }
            }
          })

          layerGroup.addLayer(geoJsonLayer)

          // Store bounds for this layer
          this.layerBounds[collection.id] = geoJsonLayer.getBounds()
          
          // Update map view if this is the only active layer
          this.$nextTick(() => {
            this.updateMapView()
          })
        }
      } catch (error) {
        console.error('MapView - Error loading features:', error)
      }
    },
    async handleCoverageCollection(collection, layerGroup) {
      const wmsUrl = getWMSUrl(collection.id)
      const wmsLayer = L.tileLayer.wms(wmsUrl, {
        layers: collection.id,
        format: 'image/png',
        transparent: true,
        version: '1.3.0'
      })
      layerGroup.addLayer(wmsLayer)
    },
    async handleTileCollection(collection, layerGroup) {
      try {
        // Get tile set info
        const tileInfo = await fetchTileSetInfo(collection.id)
        console.log('MapView - Tile info:', tileInfo)

        // Check if vector tiles are supported
        const vectorTilesSupported = tileInfo.links?.some(link => 
          link.type === 'application/vnd.mapbox-vector-tile')

        if (vectorTilesSupported) {
          const vectorTileUrl = getTileUrl(collection.id, 'mvt')
          const vectorTileLayer = L.tileLayer(vectorTileUrl)
          layerGroup.addLayer(vectorTileLayer)
        } else {
          const tileUrl = getTileUrl(collection.id)
          const tileLayer = L.tileLayer(tileUrl)
          layerGroup.addLayer(tileLayer)
        }
      } catch (error) {
        console.error('MapView - Error loading tiles:', error)
      }
    },
    updateMapView() {
      if (!this.map || !this.isInitialized) return

      try {
        const activeCollections = this.activeCollectionObjects
        if (activeCollections.length === 0) return

        // If only one collection is active, zoom to its bounds
        if (activeCollections.length === 1) {
          const bounds = this.layerBounds[activeCollections[0].id]
          if (bounds && bounds.isValid()) {
            this.map.setView(bounds.getCenter(), this.map.getBoundsZoom(bounds))
          }
        } else {
          // For multiple collections, fit to combined bounds
          const bounds = L.latLngBounds([])
          activeCollections.forEach(collection => {
            const layerBounds = this.layerBounds[collection.id]
            if (layerBounds && layerBounds.isValid()) {
              bounds.extend(layerBounds)
            }
          })
          
          if (bounds.isValid()) {
            this.map.setView(bounds.getCenter(), this.map.getBoundsZoom(bounds))
          }
        }
      } catch (error) {
        console.error('Error updating map view:', error)
      }
    },
    removeCollection(collectionId) {
      if (!this.map || !this.layerGroups[collectionId]) return

      try {
        const layerGroup = this.layerGroups[collectionId]
        
        // Close any open popups
        layerGroup.eachLayer(layer => {
          if (layer.closePopup) {
            layer.closePopup()
          }
        })

        // Remove from map and clear
        if (this.map.hasLayer(layerGroup)) {
          this.map.removeLayer(layerGroup)
        }
        layerGroup.clearLayers()
        
        // Clean up references
        delete this.layerGroups[collectionId]
        delete this.layerBounds[collectionId]
        
        // Update view for remaining layers
        this.$nextTick(() => {
          this.updateMapView()
        })
      } catch (error) {
        console.error('Error removing collection:', error)
      }
    },
    createPopupContent(properties, queryables) {
      if (!properties) return 'No properties available'

      const content = document.createElement('div')
      content.className = 'feature-popup'

      Object.entries(properties).forEach(([key, value]) => {
        const property = queryables?.properties?.[key]
        if (value !== null && value !== undefined) {
          const row = document.createElement('div')
          row.className = 'property-row'
          
          const label = document.createElement('strong')
          label.textContent = property?.title || key
          label.className = 'property-label'
          
          const valueElement = document.createElement('span')
          valueElement.textContent = value
          valueElement.className = 'property-value'
          
          row.appendChild(label)
          row.appendChild(document.createTextNode(': '))
          row.appendChild(valueElement)
          content.appendChild(row)
        }
      })

      return content
    },
    getCollectionColor(collectionId) {
      if (!this.layerColors[collectionId]) {
        this.layerColors[collectionId] = this.getRandomColor()
      }
      return this.layerColors[collectionId]
    },
    getRandomColor() {
      const letters = '0123456789ABCDEF'
      let color = '#'
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)]
      }
      return color
    }
  },
  watch: {
    activeCollectionObjects: {
      handler(newCollections, oldCollections = []) {
        console.log('Active collection objects changed:', {
          new: newCollections,
          old: oldCollections
        })
        
        if (!this.map || !this.isInitialized) {
          console.warn('Map not initialized yet')
          return
        }

        // Handle removed collections
        if (oldCollections) {
          oldCollections.forEach(collection => {
            if (!newCollections.find(c => c.id === collection.id)) {
              console.log('Removing collection layer:', collection.id)
              this.removeCollection(collection.id)
            }
          })
        }

        // Handle new collections
        newCollections.forEach(collection => {
          if (!oldCollections.find(c => c.id === collection.id)) {
            console.log('Adding new collection layer:', collection.id)
            this.$nextTick(() => {
              this.loadCollectionLayer(collection)
            })
          }
        })
      },
      immediate: true,
      deep: true
    }
  }
}
</script>

<style>
.map-container {
  flex: 1;
  position: relative;
}

#map {
  width: 100%;
  height: 100%;
}

.feature-popup {
  padding: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.property-row {
  margin-bottom: 4px;
  display: flex;
  gap: 8px;
}

.property-label {
  font-weight: 600;
  color: #333;
}

.property-value {
  color: #666;
  word-break: break-word;
}

/* Override Leaflet popup styles */
.leaflet-popup-content {
  margin: 8px;
  min-width: 200px;
}

.leaflet-popup-content-wrapper {
  border-radius: 4px;
}
</style>
