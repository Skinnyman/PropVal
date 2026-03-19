import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';



const CIRCLE_COLOR_EXPR = [
  'match',
  ['get', 'type'],
  'Residential',  '#1e293b',
  'residential',  '#1e293b',
  'Commercial',   '#fbbf24',
  'commercial',   '#fbbf24',
  'Office',       '#0d9488',
  'office',       '#0d9488',
  'Mixed-use',    '#9333ea',
  'mixed-use',    '#9333ea',
  'Mixed-Use',    '#9333ea',
  'Industrial',   '#dc2626',
  'industrial',   '#dc2626',
  'Land',         '#94a3b8',
  'land',         '#94a3b8',
  '#3b82f6' // fallback blue
];

const MapComponent = ({
  properties,
  onPropertySelect,
  onLocationSelect,
  onBoundsChange,
  selectedId = null,
  comparableIds = [],
  selectionMode = false,
  viewResetTrigger = 0,
  initialCenter = [-1.0232, 7.9465],
  initialZoom = 6
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [tokenError, setTokenError] = useState(false);
  const [styleLoaded, setStyleLoaded] = useState(false);

  const onPropertySelectRef = useRef(onPropertySelect);
  const onLocationSelectRef = useRef(onLocationSelect);
  const onBoundsChangeRef = useRef(onBoundsChange);
  const prevSelectedIdRef = useRef(null);

  useEffect(() => { onPropertySelectRef.current = onPropertySelect; }, [onPropertySelect]);
  useEffect(() => { onLocationSelectRef.current = onLocationSelect; }, [onLocationSelect]);
  useEffect(() => { onBoundsChangeRef.current = onBoundsChange; }, [onBoundsChange]);

  // Convert properties to GeoJSON - includes ALL valid properties
  const getGeoJSON = useCallback((props) => {
    const features = (props || [])
      .map(prop => {
        const coords = prop.location?.coordinates?.coordinates;
        // Only include if we have valid, non-zero coordinates
        if (!coords || !Array.isArray(coords) || coords.length < 2) return null;
        const [lng, lat] = coords;
        if (isNaN(lng) || isNaN(lat) || (lng === 0 && lat === 0)) return null;

        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lng, lat] },
          properties: {
            id: prop._id,
            suburb: prop.location?.suburb || 'Unknown',
            region: prop.location?.region || '',
            type: prop.propertyInfo?.propertyType || '',
            price: prop.marketData?.salePrice || 0,
          }
        };
      })
      .filter(Boolean);

    return { type: 'FeatureCollection', features };
  }, []);

  // Initialise map once
  useEffect(() => {
    const token = process.env.REACT_APP_MAPBOX_TOKEN;
    if (!token) { setTokenError(true); return; }

    mapboxgl.accessToken = token;
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter,
      zoom: initialZoom,
      attributionControl: false
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true
      }),
      'top-right'
    );

    mapRef.current.on('style.load', () => {
      if (!mapRef.current || mapRef.current.getSource('properties')) return;

      setTimeout(() => mapRef.current?.resize(), 100);

      // Add the GeoJSON source (empty initially - data loaded via useEffect below)
      mapRef.current.addSource('properties', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      // --- Cluster layers ---
      mapRef.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'properties',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#bae6fd', 10, '#7dd3fc', 30, '#38bdf8'],
          'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 30, 40],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });

      mapRef.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'properties',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        }
      });

      // --- Comparable properties highlight ---
      mapRef.current.addLayer({
        id: 'comparable-points',
        type: 'circle',
        source: 'properties',
        filter: ['in', ['get', 'id'], ['literal', []]],
        paint: {
          'circle-color': '#10b981',
          'circle-radius': 12,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#fff'
        }
      });

      // --- Regular unclustered point halo (glow) ---
      mapRef.current.addLayer({
        id: 'unclustered-point-halo',
        type: 'circle',
        source: 'properties',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': CIRCLE_COLOR_EXPR,
          'circle-opacity': 0.3,
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            6, 10,
            12, 18,
            16, 28
          ]
        }
      });

      // --- Regular unclustered point (solid dot) ---
      mapRef.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'properties',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': CIRCLE_COLOR_EXPR,
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            6, 6,
            12, 10,
            16, 14
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      // --- Selected property ring (sits on top of the dot) ---
      mapRef.current.addLayer({
        id: 'selected-point',
        type: 'circle',
        source: 'properties',
        filter: ['==', ['get', 'id'], ''],
        paint: {
          'circle-color': 'transparent',
          'circle-radius': 22,
          'circle-stroke-width': 4,
          'circle-stroke-color': CIRCLE_COLOR_EXPR
        }
      });

      // --- Suburb label ---
      mapRef.current.addLayer({
        id: 'unclustered-labels',
        type: 'symbol',
        source: 'properties',
        filter: ['!', ['has', 'point_count']],
        layout: {
          'text-field': ['get', 'suburb'],
          'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 8, 10, 14, 13],
          'text-offset': [1.2, 0],
          'text-anchor': 'left',
          'text-allow-overlap': false,
          'text-optional': true
        },
        paint: {
          'text-color': '#0f172a',
          'text-halo-color': 'rgba(255,255,255,0.9)',
          'text-halo-width': 2
        }
      });

      // ---- Event handlers ----

      mapRef.current.on('click', 'unclustered-point', (e) => {
        const coords = e.features[0].geometry.coordinates.slice();
        const { id, suburb, type, price } = e.features[0].properties;

        if (onPropertySelectRef.current) onPropertySelectRef.current(id);

        const html = `
          <div class="p-3 min-w-[200px]">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">${type}</p>
            <h4 class="text-base font-black text-primary mb-3">${suburb}</h4>
            <div class="bg-blue-50/50 p-2 rounded-lg mb-4">
              <p class="text-[8px] text-accent uppercase font-black">Sale Price</p>
              <p class="text-sm font-black text-accent">GHS ${Number(price).toLocaleString()}</p>
            </div>
            <button 
              onclick="window.location.href='/properties/${id}'"
              class="w-full py-2 bg-slate-900 text-white text-[10px] font-black rounded-xl hover:bg-black transition uppercase tracking-widest"
            >
              View Full Details
            </button>
          </div>
        `;

        new mapboxgl.Popup({ offset: 15, className: 'custom-map-popup' })
          .setLngLat(coords)
          .setHTML(html)
          .addTo(mapRef.current);
      });

      mapRef.current.on('click', 'clusters', (e) => {
        const features = mapRef.current.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features[0].properties.cluster_id;
        mapRef.current.getSource('properties').getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          mapRef.current.easeTo({ center: features[0].geometry.coordinates, zoom });
        });
      });

      mapRef.current.on('mouseenter', 'unclustered-point', () => { mapRef.current.getCanvas().style.cursor = 'pointer'; });
      mapRef.current.on('mouseleave', 'unclustered-point', () => { mapRef.current.getCanvas().style.cursor = ''; });
      mapRef.current.on('mouseenter', 'clusters', () => { mapRef.current.getCanvas().style.cursor = 'pointer'; });
      mapRef.current.on('mouseleave', 'clusters', () => { mapRef.current.getCanvas().style.cursor = ''; });

      mapRef.current.on('click', (e) => {
        if (!onLocationSelectRef.current) return;
        const features = mapRef.current.queryRenderedFeatures(e.point, { layers: ['unclustered-point', 'clusters'] });
        if (features.length === 0) {
          onLocationSelectRef.current({ lng: e.lngLat.lng, lat: e.lngLat.lat });
        }
      });

      mapRef.current.on('moveend', () => {
        if (onBoundsChangeRef.current) {
          const b = mapRef.current.getBounds();
          onBoundsChangeRef.current([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].join(','));
        }
      });

      // Initial zoom to Ghana
      mapRef.current.fitBounds([[-3.25, 4.70], [1.20, 11.10]], { padding: 40, duration: 0 });

      setStyleLoaded(true);
    });

    const resizeObserver = new ResizeObserver(() => { if (mapRef.current) mapRef.current.resize(); });
    if (mapContainerRef.current) resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setStyleLoaded(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update GeoJSON data whenever properties array changes
  useEffect(() => {
    if (!mapRef.current || !styleLoaded) return;
    const source = mapRef.current.getSource('properties');
    if (!source) return;

    const geoJSON = getGeoJSON(properties || []);
    source.setData(geoJSON);

    // Update layer filters
    const setFilter = (id, filter) => {
      if (mapRef.current.getLayer(id)) mapRef.current.setFilter(id, filter);
    };

    setFilter('selected-point', ['==', ['get', 'id'], selectedId || '']);
    setFilter('comparable-points', ['in', ['get', 'id'], ['literal', comparableIds]]);

    // If selection changed, fly to the property
    if (selectedId && selectedId !== prevSelectedIdRef.current) {
      const sel = (properties || []).find(p => p._id === selectedId);
      const coords = sel?.location?.coordinates?.coordinates;
      if (coords && !isNaN(coords[0]) && coords[0] !== 0) {
        mapRef.current.flyTo({ center: coords, zoom: 15, essential: true });
      }
    }
    prevSelectedIdRef.current = selectedId;

  }, [properties, selectedId, comparableIds, getGeoJSON, styleLoaded]);

  // Wide View — zoom out to Ghana
  useEffect(() => {
    if (mapRef.current && viewResetTrigger > 0) {
      mapRef.current.fitBounds([[-3.25, 4.70], [1.20, 11.10]], { padding: 40, duration: 1500 });
    }
  }, [viewResetTrigger]);

  if (tokenError) {
    return (
      <div className="w-full h-full rounded-[2rem] border border-red-100 bg-red-50 flex items-center justify-center p-8 text-center text-red-600">
        <p className="font-bold">Mapbox Token Missing</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-[2rem] overflow-hidden border border-slate-100 shadow-xl bg-slate-50 relative">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

export default MapComponent;
