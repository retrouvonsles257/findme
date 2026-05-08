import React, { useEffect, useRef, useState } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { mapConfig } from '../../../config/map.config';
import styles from './MapTilerView.module.css';

export interface MapTilerMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  type: 'missing' | 'sighting' | 'organization' | 'alert';
  image?: string;
  data?: Record<string, unknown>;
}

export interface MapTilerViewProps {
  markers?: MapTilerMarker[];
  center?: [number, number]; // [lat, lng]
  zoom?: number;
  onMarkerClick?: (marker: MapTilerMarker) => void;
  onMapClick?: (lat: number, lng: number) => void;
  height?: string;
  showControls?: boolean;
  interactive?: boolean;
  className?: string;
}

const markerColors: Record<string, string> = {
  missing: '#ef4444',
  sighting: '#3b82f6',
  organization: '#8b5cf6',
  alert: '#f59e0b',
};

/**
 * MapTilerView - Real map component using MapTiler SDK
 */
export const MapTilerView: React.FC<MapTilerViewProps> = ({
  markers = [],
  center = [3.848, 11.5021], // Cameroon default
  zoom = 6,
  onMarkerClick,
  onMapClick,
  height = '400px',
  showControls = true,
  interactive = true,
  className,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maptilersdk.Map | null>(null);
  const markersRef = useRef<maptilersdk.Marker[]>([]);
  const onMapClickRef = useRef<typeof onMapClick>(onMapClick);
  const lastMarkersSigRef = useRef('');
  const lastCenterRef = useRef<{ lat: number; lng: number; zoom: number } | null>(null);
  const initialCenterRef = useRef<[number, number]>(center);
  const initialZoomRef = useRef<number>(zoom);
  const initialInteractiveRef = useRef<boolean>(interactive);
  const initialShowControlsRef = useRef<boolean>(showControls);
  const [isMapReady, setIsMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const centerLat = center[0];
  const centerLng = center[1];

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  // Initialize map only once to avoid re-creation on form typing
  useEffect(() => {
    if (!mapContainer.current) return;

    // Check if MapTiler API key is available
    if (!mapConfig.maptiler.apiKey) {
      setError('MapTiler API key not configured');
      return;
    }

    let mapInstance: maptilersdk.Map | null = null;

    try {
      // Set MapTiler API key
      maptilersdk.config.apiKey = mapConfig.maptiler.apiKey;

      // Create map instance
      mapInstance = new maptilersdk.Map({
        container: mapContainer.current,
        style: maptilersdk.MapStyle.STREETS,
        center: [initialCenterRef.current[1], initialCenterRef.current[0]], // MapTiler uses [lng, lat]
        zoom: initialZoomRef.current,
        interactive: initialInteractiveRef.current,
        navigationControl: initialShowControlsRef.current,
        geolocateControl: initialShowControlsRef.current,
        scaleControl: initialShowControlsRef.current,
      });

      map.current = mapInstance;

      // Map load event
      mapInstance.on('load', () => {
        setIsMapReady(true);
      });

      // Map click event
      mapInstance.on('click', (e) => {
        onMapClickRef.current?.(e.lngLat.lat, e.lngLat.lng);
      });
    } catch (err) {
      console.error('Error initializing MapTiler:', err);
      setError('Failed to initialize map');
    }

    // Cleanup
    return () => {
      if (mapInstance) {
        mapInstance.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when they change
  useEffect(() => {
    if (!map.current || !isMapReady) return;
    const signature = markers
      .map((m) => `${m.id}:${m.lat}:${m.lng}:${m.type}:${m.label}`)
      .join('|');
    if (signature === lastMarkersSigRef.current) return;
    lastMarkersSigRef.current = signature;

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach((markerData) => {
      // Create custom marker element
      const el = document.createElement('div');
      el.className = styles.customMarker;
      el.style.backgroundColor = markerColors[markerData.type] || '#1d4ed8';

      // Add inner dot
      const dot = document.createElement('div');
      dot.className = styles.markerDot;
      el.appendChild(dot);

      // Create marker
      const marker = new maptilersdk.Marker({
        element: el,
        anchor: 'bottom',
      })
        .setLngLat([markerData.lng, markerData.lat])
        .addTo(map.current!);

      // Add popup
      const popup = new maptilersdk.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false,
      }).setHTML(`
        <div class="${styles.popupContent}">
          ${markerData.image ? `<img src="${markerData.image}" alt="${markerData.label}" class="${styles.popupImage}" />` : ''}
          <h4>${markerData.label}</h4>
          <span class="${styles.popupType}" style="background-color: ${markerColors[markerData.type]}">${markerData.type}</span>
        </div>
      `);

      marker.setPopup(popup);

      // Click handler
      el.addEventListener('click', () => {
        if (onMarkerClick) {
          onMarkerClick(markerData);
        }
      });

      markersRef.current.push(marker);
    });
  }, [markers, isMapReady, onMarkerClick]);

  // Update center when it changes
  useEffect(() => {
    if (map.current && isMapReady) {
      const prev = lastCenterRef.current;
      if (
        prev &&
        prev.lat === centerLat &&
        prev.lng === centerLng &&
        prev.zoom === zoom
      ) {
        return;
      }
      lastCenterRef.current = { lat: centerLat, lng: centerLng, zoom };
      map.current.flyTo({
        center: [centerLng, centerLat],
        zoom: zoom,
        duration: 1000,
      });
    }
  }, [centerLat, centerLng, zoom, isMapReady]);

  if (error) {
    return (
      <div className={`${styles.mapContainer} ${className || ''}`} style={{ height }}>
        <div className={styles.errorState}>
          <p>{error}</p>
          <p className={styles.errorHint}>Please check your MapTiler API key configuration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.mapWrapper} ${className || ''}`} style={{ height }}>
      <div ref={mapContainer} className={styles.mapContainer} />
      {!isMapReady && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
          <p>Loading map...</p>
        </div>
      )}
    </div>
  );
};

export default MapTilerView;
