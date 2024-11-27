# PyGeoAPI Collections Viewer

## Overview
This is a Vue.js application that retrieves collections from the PyGeoAPI demo server and displays them on an interactive Leaflet map with a side panel for layer toggling and language switching.

## Features
- Fetch collections from https://demo.pygeoapi.io/master/collections
- Interactive Leaflet map
- Side panel with collection list
- Layer toggling
- Internationalization (i18n) support
- RTL and LTR language support (English and Arabic)

## Prerequisites
- Node.js (v14 or later)
- npm (v6 or later)

## Installation
1. Clone the repository
2. Install dependencies:
```bash
npm install
```

## Running the Application
```bash
npm run serve
```

## Building for Production
```bash
npm run build
```

## Technologies Used
- Vue.js 3
- Vuex
- Vue I18n
- Leaflet
- Axios

## How to Use
1. The application loads collections from the PyGeoAPI demo server
2. Use the checkboxes in the side panel to toggle layers on the map
3. Switch between English and Arabic languages using the language buttons

## License
MIT License
