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
  const [isMapReady, setIsMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize map
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
        center: [center[1], center[0]], // MapTiler uses [lng, lat]
        zoom: zoom,
        interactive: interactive,
        navigationControl: showControls,
        geolocateControl: showControls,
        scaleControl: showControls,
      });

      map.current = mapInstance;

      // Map load event
      mapInstance.on('load', () => {
        setIsMapReady(true);
      });

      // Map click event
      if (onMapClick) {
        mapInstance.on('click', (e) => {
          onMapClick(e.lngLat.lat, e.lngLat.lng);
        });
      }
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
  }, [center, zoom, interactive, showControls, onMapClick]);

  // Update markers when they change
  useEffect(() => {
    if (!map.current || !isMapReady) return;

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
      map.current.flyTo({
        center: [center[1], center[0]],
        zoom: zoom,
        duration: 1000,
      });
    }
  }, [center, zoom, isMapReady]);

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
