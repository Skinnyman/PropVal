import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MapComponent = ({ properties }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [tokenError, setTokenError] = useState(false);

  useEffect(() => {
    const token = process.env.REACT_APP_MAPBOX_TOKEN;
    
    if (!token) {
      console.warn('Mapbox access token is missing from environment variables!');
      setTokenError(true);
      return;
    }

    mapboxgl.accessToken = token;

    if (mapRef.current) return;

    try {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-0.187, 5.603],
        zoom: 11,
        attributionControl: false
      });

      mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Intensive resize logic for potential race conditions with container visibility
      mapRef.current.on('load', () => {
        setTimeout(() => {
          if (mapRef.current) mapRef.current.resize();
        }, 100);
      });

    } catch (err) {
      console.error('Error initializing Mapbox:', err);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !properties) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    properties.forEach((prop) => {
      if (prop.location?.coordinates?.lng && prop.location?.coordinates?.lat) {
        const marker = new mapboxgl.Marker({ color: '#3b82f6' })
          .setLngLat([prop.location.coordinates.lng, prop.location.coordinates.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<div class="p-2 min-w-[120px]">
                <h3 class="font-bold text-slate-800 text-sm mb-1">${prop.location?.suburb || 'Property'}</h3>
                <p class="text-xs font-black text-accent">GHS ${prop.marketData?.salePrice?.toLocaleString() || 'N/A'}</p>
              </div>`
            )
          )
          .addTo(mapRef.current);
        
        markersRef.current.push(marker);
      }
    });

    if (properties.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      let hasCoords = false;
      properties.forEach(prop => {
        if (prop.location?.coordinates?.lng && prop.location?.coordinates?.lat) {
          bounds.extend([prop.location.coordinates.lng, prop.location.coordinates.lat]);
          hasCoords = true;
        }
      });
      if (hasCoords) {
        mapRef.current.fitBounds(bounds, { padding: 50, maxZoom: 14, duration: 1000 });
      }
    }
  }, [properties]);

  if (tokenError) {
    return (
      <div className="w-full h-full rounded-[2rem] border border-red-100 bg-red-50 flex items-center justify-center p-8 text-center text-red-600">
        <div>
          <p className="font-bold mb-2">Mapbox Access Token Missing</p>
          <p className="text-sm">Please ensure REACT_APP_MAPBOX_TOKEN is set in your .env file and restart the development server.</p>
        </div>
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
