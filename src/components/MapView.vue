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
      layerBounds: {},
      isInitialized: false,
      initializationAttempts: 0
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
      if (this.isInitialized) {
        console.log('Map already initialized')
        return
      }

      if (this.initializationAttempts >= 3) {
        console.error('Failed to initialize map after 3 attempts')
        return
      }

      this.initializationAttempts++

      this.$nextTick(() => {
        try {
          if (!document.getElementById('map')) {
            console.warn('Map container not found, retrying in 200ms')
            setTimeout(() => this.initMap(), 200)
            return
          }

          if (this.map) {
            console.log('Cleaning up existing map instance')
            this.map.remove()
            this.map = null
          }

          this.map = L.map('map', {
            zoomAnimation: false, // Disable zoom animation to prevent RTL issues
            fadeAnimation: false, // Disable fade animation to prevent RTL issues
            markerZoomAnimation: false // Disable marker zoom animation
          }).setView([0, 0], 2)

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: ' OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(this.map)

          this.map.on('moveend', () => {
            if (this.map) {
              console.log('MapView - Map moved:', {
                center: this.map.getCenter(),
                zoom: this.map.getZoom()
              })
            }
          })

          // Make sure map is properly sized
          setTimeout(() => {
            if (this.map) {
              this.map.invalidateSize()
              this.isInitialized = true
              this.initializationAttempts = 0
              console.log('Map initialized successfully')
            }
          }, 200)
        } catch (error) {
          console.error('Error initializing map:', error)
          setTimeout(() => this.initMap(), 200)
        }
      })
    },
    async loadCollectionLayer(collection) {
      if (!this.map || !this.isInitialized) {
        console.warn('Map not initialized yet, retrying in 200ms')
        setTimeout(() => this.loadCollectionLayer(collection), 200)
        return
      }

      if (!collection) {
        console.warn('Invalid collection provided')
        return
      }

      try {
        console.log('MapView - Loading collection:', collection.id)
        
        // Create or get layer group
        if (!this.layerGroups[collection.id]) {
          this.layerGroups[collection.id] = L.layerGroup()
        }
        const layerGroup = this.layerGroups[collection.id]

        // Clear existing layers
        layerGroup.clearLayers()

        // Get collection details and determine render type
        const details = await fetchCollectionDetails(this.serverUrl, collection.id, this.locale)
        const renderType = getCollectionRenderType(details)
        console.log('MapView - Collection type:', { collectionId: collection.id, renderType, details })

        // Handle different collection types
        switch (renderType) {
          case 'feature':
            await this.handleFeatureCollection(collection, layerGroup)
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
    async handleFeatureCollection(collection, layerGroup) {
      try {
        console.log('Handling feature collection:', collection.id)
        const features = await fetchFeatures(this.serverUrl, collection.id, {}, this.locale)
        const queryables = await fetchCollectionQueryables(this.serverUrl, collection.id, this.locale)
        
        if (!features?.features?.length) {
          console.warn('No features found for collection:', collection.id)
          return
        }

        const collectionColor = this.$store.getters.getCollectionColor(collection.id)

        const geoJsonLayer = L.geoJSON(features, {
          style: (feature) => ({
            color: collectionColor,
            weight: 2,
            opacity: 0.8,
            fillColor: collectionColor,
            fillOpacity: 0.2,
            dashArray: null
          }),
          pointToLayer: (feature, latlng) => {
            return L.circleMarker(latlng, {
              radius: 6,
              fillColor: collectionColor,
              color: collectionColor,
              weight: 2,
              opacity: 1,
              fillOpacity: 0.6
            })
          },
          onEachFeature: (feature, layer) => {
            const popupContent = this.createPopupContent(feature.properties, queryables)
            layer.bindPopup(popupContent)
            
            // Add hover effect
            layer.on({
              mouseover: (e) => {
                const layer = e.target
                layer.setStyle({
                  weight: 3,
                  opacity: 1,
                  fillOpacity: 0.4
                })
                if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                  layer.bringToFront()
                }
              },
              mouseout: (e) => {
                const layer = e.target
                geoJsonLayer.resetStyle(layer)
              }
            })
          }
        })

        layerGroup.addLayer(geoJsonLayer)
        this.map.addLayer(layerGroup)

        // Store bounds for this collection
        const bounds = geoJsonLayer.getBounds()
        if (bounds.isValid()) {
          this.layerBounds[collection.id] = bounds
          this.map.fitBounds(bounds, { padding: [50, 50] })
        }

      } catch (error) {
        console.error('Error handling feature collection:', collection.id, error)
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

        console.log('Collection removed successfully:', collectionId)
      } catch (error) {
        console.error('Error removing collection:', collectionId, error)
      }
    },
    cleanupMap() {
      console.log('Cleaning up map')
      if (this.map) {
        // Remove all layer groups
        Object.keys(this.layerGroups).forEach(id => {
          const group = this.layerGroups[id]
          if (group) {
            group.clearLayers()
            if (this.map.hasLayer(group)) {
              this.map.removeLayer(group)
            }
          }
        })

        // Clear all references
        this.layerGroups = {}
        this.layerBounds = {}

        // Remove the map
        this.map.remove()
        this.map = null
      }
    },
    beforeDestroy() {
      this.cleanupMap()
    }
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
    },
    locale: {
      handler() {
        console.log('Locale changed, reinitializing map')
        this.cleanupMap()
        this.$nextTick(() => {
          this.isInitialized = false
          this.initializationAttempts = 0
          this.initMap()
        })
      }
    }
  }
}
</script>

<style>
.map-container {
  position: absolute;
  top: 0;
  left: var(--sidebar-width);
  right: 0;
  bottom: 0;
  transition: left 0.3s ease;
}

.sidebar-collapsed + .map-container {
  left: var(--sidebar-collapsed-width);
}

#map {
  width: 100%;
  height: 100%;
}

/* RTL Support */
[dir="rtl"] .map-container {
  left: 0;
  right: var(--sidebar-width);
  transition: right 0.3s ease;
}

[dir="rtl"] .sidebar-collapsed + .map-container {
  right: var(--sidebar-collapsed-width);
}

@media (max-width: 768px) {
  .map-container {
    position: relative;
    left: 0;
    flex: 1;
    height: calc(100vh - var(--header-height) - 300px);
  }

  .sidebar-collapsed + .map-container {
    left: 0;
    height: calc(100vh - var(--header-height) - 40px);
  }

  [dir="rtl"] .map-container {
    right: 0;
  }

  [dir="rtl"] .sidebar-collapsed + .map-container {
    right: 0;
  }
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
