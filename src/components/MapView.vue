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
  fetchCollectionQueryables,
  getWMSUrl,
  getTileUrl,
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
    ...mapState(['collections', 'activeCollections', 'serverUrl', 'locale']),
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
        const details = await fetchCollectionDetails(this.serverUrl, collection.id, this.locale)
        const renderType = getCollectionRenderType(details)
        console.log('MapView - Collection type:', { collectionId: collection.id, renderType, details })

        // Handle different collection types
        switch (renderType) {
          case 'feature':
            await this.handleFeatureCollection(collection, layerGroup, color)
            break
          case 'coverage':
            await this.handleCoverageCollection(collection, layerGroup)
            break
          case 'tile':
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
        console.log('MapView - Loading features for collection:', collection.id)
        const features = await fetchFeatures(this.serverUrl, collection.id, {}, this.locale)
        console.log('Features received:', features)

        if (!features || !features.features || !Array.isArray(features.features)) {
          console.error('Invalid features response:', features)
          return
        }

        // Create a single GeoJSON layer for all features
        const geoJsonLayer = L.geoJSON(features, {
          style: () => ({
            color: color,
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3
          }),
          pointToLayer: (feature, latlng) => {
            return L.circleMarker(latlng, {
              radius: 8,
              fillColor: color,
              color: '#fff',
              weight: 1,
              opacity: 1,
              fillOpacity: 0.8
            })
          },
          onEachFeature: async (feature, layer) => {
            if (feature.properties) {
              try {
                const queryables = await fetchCollectionQueryables(this.serverUrl, collection.id, this.locale)
                layer.bindPopup(() => this.createPopupContent(feature.properties, queryables))
              } catch (error) {
                console.error('Error fetching queryables:', error)
                layer.bindPopup(() => this.createSimplePopupContent(feature.properties))
              }
            }
          }
        })

        // Add the layer and update bounds
        layerGroup.addLayer(geoJsonLayer)

        // Update bounds
        const bounds = geoJsonLayer.getBounds()
        if (bounds.isValid()) {
          this.layerBounds[collection.id] = bounds
          this.map.fitBounds(bounds, { padding: [50, 50] })
          console.log('Layer added and bounds set:', {
            collectionId: collection.id,
            bounds: bounds.toBBoxString()
          })
        }
      } catch (error) {
        console.error(`Error loading features for collection ${collection.id}:`, error)
      }
    },
    async handleCoverageCollection(collection, layerGroup) {
      try {
        const wmsUrl = getWMSUrl(this.serverUrl, collection.id, this.locale)
        console.log('Adding WMS layer:', wmsUrl)
        
        const layer = L.tileLayer.wms(wmsUrl, {
          layers: collection.id,
          format: 'image/png',
          transparent: true,
          version: '1.3.0'
        })
        
        layerGroup.addLayer(layer)
        console.log('WMS layer added:', collection.id)
      } catch (error) {
        console.error(`Error loading coverage for collection ${collection.id}:`, error)
      }
    },
    async handleTileCollection(collection, layerGroup) {
      try {
        const tileUrl = getTileUrl(this.serverUrl, collection.id, 'mvt', this.locale)
        console.log('Adding tile layer:', tileUrl)
        
        const layer = L.tileLayer(tileUrl, {
          tileSize: 256,
          maxZoom: 22
        })
        
        layerGroup.addLayer(layer)
        console.log('Tile layer added:', collection.id)
      } catch (error) {
        console.error(`Error loading tiles for collection ${collection.id}:`, error)
      }
    },
    createPopupContent(properties, queryables) {
      const content = document.createElement('div')
      content.className = 'popup-content'

      const table = document.createElement('table')
      table.className = 'property-table'

      Object.entries(properties).forEach(([key, value]) => {
        const queryable = queryables?.properties?.[key]
        if (!queryable) return

        const row = document.createElement('tr')
        
        const keyCell = document.createElement('td')
        keyCell.className = 'property-key'
        keyCell.textContent = queryable.title || key
        
        const valueCell = document.createElement('td')
        valueCell.className = 'property-value'
        valueCell.textContent = value

        row.appendChild(keyCell)
        row.appendChild(valueCell)
        table.appendChild(row)
      })

      content.appendChild(table)
      return content
    },
    createSimplePopupContent(properties) {
      const content = document.createElement('div')
      content.className = 'popup-content'

      const table = document.createElement('table')
      table.className = 'property-table'

      Object.entries(properties).forEach(([key, value]) => {
        const row = document.createElement('tr')
        
        const keyCell = document.createElement('td')
        keyCell.className = 'property-key'
        keyCell.textContent = key
        
        const valueCell = document.createElement('td')
        valueCell.className = 'property-value'
        valueCell.textContent = value

        row.appendChild(keyCell)
        row.appendChild(valueCell)
        table.appendChild(row)
      })

      content.appendChild(table)
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
    },
    removeCollection(collectionId) {
      try {
        console.log('Removing collection from map:', collectionId)
        if (!this.map || !this.layerGroups[collectionId]) {
          console.warn('No layer group found for collection:', collectionId)
          return
        }

        const layerGroup = this.layerGroups[collectionId]
        
        // Remove all layers from the group
        layerGroup.eachLayer(layer => {
          if (layer.closePopup) {
            layer.closePopup()
          }
          layerGroup.removeLayer(layer)
        })

        // Remove the layer group from the map
        if (this.map.hasLayer(layerGroup)) {
          this.map.removeLayer(layerGroup)
        }

        // Clean up references
        delete this.layerGroups[collectionId]
        delete this.layerBounds[collectionId]
        delete this.layerColors[collectionId]

        console.log('Collection removed successfully:', collectionId)
      } catch (error) {
        console.error('Error removing collection:', collectionId, error)
      }
    },
  },
  watch: {
    activeCollectionObjects: {
      handler(newCollections, oldCollections = []) {
        console.log('Active collection objects changed:', { new: newCollections, old: oldCollections })
        
        // Handle removed collections
        oldCollections.forEach(collection => {
          if (!newCollections.find(c => c.id === collection.id)) {
            console.log('Removing collection:', collection.id)
            this.removeCollection(collection.id)
          }
        })

        // Handle added collections
        newCollections.forEach(collection => {
          if (!oldCollections.find(c => c.id === collection.id)) {
            console.log('Adding new collection layer:', collection.id)
            this.loadCollectionLayer(collection)
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
  width: 100%;
  height: 100%;
  position: relative;
}

#map {
  width: 100%;
  height: 100%;
}

.popup-content {
  padding: 10px;
  max-height: 300px;
  overflow-y: auto;
}

.property-table {
  width: 100%;
  border-collapse: collapse;
}

.property-table td {
  padding: 4px 8px;
  border-bottom: 1px solid #eee;
}

.property-key {
  font-weight: bold;
  color: #666;
}

.property-value {
  color: #333;
}
</style>
