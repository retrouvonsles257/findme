/**
 * MapTiler Map Service
 * Core map functionality: initialization, markers, layers, events
 */

import {
  MapConfiguration,
  MarkerConfig,
  LayerConfig,
  MapEventType,
  GeoJSONFeature,
  GeoJSONFeatureCollection,
  Bounds,
} from './maptilerConfig';

import { maptilerConfig } from './maptilerConfig';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Map Event Handler
 */
export type MapEventHandler = (event: unknown) => void;

/**
 * Map Click Event
 */
export interface MapClickEvent {
  lngLat: {
    lng: number;
    lat: number;
  };
  point: {
    x: number;
    y: number;
  };
  originalEvent: MouseEvent;
}

/**
 * Marker Instance (wrapper)
 */
export interface MarkerInstance {
  id: string;
  config: MarkerConfig;
  element?: HTMLElement;
  popup?: unknown;
  setLngLat(lngLat: [number, number]): void;
  addTo(map: unknown): void;
  remove(): void;
  setDraggable(draggable: boolean): void;
  togglePopup(): void;
  getCoordinates(): [number, number];
}

/**
 * Layer Instance
 */
export interface LayerInstance {
  id: string;
  config: LayerConfig;
  isVisible: boolean;
  getVisibility(): boolean;
  setVisibility(visible: boolean): void;
  setOpacity(opacity: number): void;
  getOpacity(): number;
}

/**
 * Map Source
 */
export interface MapSource {
  id: string;
  type: string;
  data?: unknown;
}

/**
 * Map Statistics
 */
export interface MapStatistics {
  markersCount: number;
  layersCount: number;
  sourcesCount: number;
  isLoaded: boolean;
  bounds?: Bounds;
}

// ============================================================================
// MAP SERVICE CLASS
// ============================================================================

/**
 * MapTiler Map Service
 * Manages map initialization, markers, layers, and interactions
 */
export class MapService {
  private static instance: MapService;
  private mapInstance: any = null;
  private markers: Map<string, MarkerInstance> = new Map();
  private layers: Map<string, LayerInstance> = new Map();
  private sources: Map<string, MapSource> = new Map();
  private eventListeners: Map<string, MapEventHandler[]> = new Map();
  private isInitialized: boolean = false;
  private currentStyle: string = 'STREETS';

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): MapService {
    if (!MapService.instance) {
      MapService.instance = new MapService();
    }
    return MapService.instance;
  }

  /**
   * Initialize map instance
   */
  public async initializeMap(config: MapConfiguration): Promise<void> {
    if (!maptilerConfig.isConfigured()) {
      throw new Error('MapTiler not configured');
    }

    if (this.isInitialized) {
      console.warn('Map already initialized');
      return;
    }

    try {
      // Dynamically import maplibre-gl
      const { default: maplibregl } = await import('maplibre-gl');

      const containerElement = typeof config.container === 'string'
        ? document.getElementById(config.container)
        : config.container;

      if (!containerElement) {
        throw new Error('Map container not found');
      }

      // Initialize map
      this.mapInstance = new maplibregl.Map({
        container: containerElement,
        style: config.style,
        center: config.center,
        zoom: config.zoom,
        pitch: config.pitch ?? 0,
        bearing: config.bearing ?? 0,
        minZoom: config.minZoom ?? 2,
        maxZoom: config.maxZoom ?? 20,
        interactive: config.interactive ?? true,
        attributionControl: config.attributionControl ? {} : false,
        hash: config.hash ?? false,
      });

      // Setup event listeners
      this.setupMapEvents();

      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize map: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Setup map event listeners
   */
  private setupMapEvents(): void {
    if (!this.mapInstance) return;

    this.mapInstance.on('load', () => {
      this.emit('load');
    });

    this.mapInstance.on('click', (event: MapClickEvent) => {
      this.emit('click', event);
    });

    this.mapInstance.on('dblclick', (event: unknown) => {
      this.emit('dblclick', event);
    });

    this.mapInstance.on('zoom', () => {
      this.emit('zoom');
    });

    this.mapInstance.on('move', () => {
      this.emit('move');
    });

    this.mapInstance.on('error', (error: unknown) => {
      this.emit('error', error);
    });
  }

  /**
   * Add event listener
   */
  public on(event: MapEventType, handler: MapEventHandler): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(handler);
  }

  /**
   * Remove event listener
   */
  public off(event: MapEventType, handler: MapEventHandler): void {
    const handlers = this.eventListeners.get(event);
    if (!handlers) return;

    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Emit event
   */
  private emit(event: string, data?: unknown): void {
    const handlers = this.eventListeners.get(event);
    if (!handlers) return;

    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  /**
   * Add marker
   */
  public addMarker(config: MarkerConfig): MarkerInstance {
    if (!this.isInitialized || !this.mapInstance) {
      throw new Error('Map not initialized');
    }

    const marker: MarkerInstance = {
      id: config.id,
      config,
      setLngLat: (lngLat: [number, number]) => {
        config.coordinates = lngLat;
      },
      addTo: () => {
        // Implementation would add to map
      },
      remove: () => {
        this.markers.delete(config.id);
      },
      setDraggable: (draggable: boolean) => {
        config.draggable = draggable;
      },
      togglePopup: () => {
        if (marker.popup) {
          // Toggle popup visibility
        }
      },
      getCoordinates: () => config.coordinates,
    };

    this.markers.set(config.id, marker);
    return marker;
  }

  /**
   * Remove marker
   */
  public removeMarker(markerId: string): boolean {
    const marker = this.markers.get(markerId);
    if (!marker) return false;

    marker.remove();
    return this.markers.delete(markerId);
  }

  /**
   * Get marker
   */
  public getMarker(markerId: string): MarkerInstance | undefined {
    return this.markers.get(markerId);
  }

  /**
   * Get all markers
   */
  public getMarkers(): MarkerInstance[] {
    return Array.from(this.markers.values());
  }

  /**
   * Update marker
   */
  public updateMarker(markerId: string, config: Partial<MarkerConfig>): void {
    const marker = this.markers.get(markerId);
    if (!marker) {
      throw new Error(`Marker ${markerId} not found`);
    }

    Object.assign(marker.config, config);
  }

  /**
   * Clear all markers
   */
  public clearMarkers(): void {
    this.markers.forEach(marker => marker.remove());
    this.markers.clear();
  }

  /**
   * Add layer
   */
  public addLayer(config: LayerConfig): LayerInstance {
    if (!this.isInitialized || !this.mapInstance) {
      throw new Error('Map not initialized');
    }

    const layer: LayerInstance = {
      id: config.id,
      config,
      isVisible: true,
      getVisibility: () => layer.isVisible,
      setVisibility: (visible: boolean) => {
        layer.isVisible = visible;
      },
      setOpacity: (opacity: number) => {
        // Would set opacity on the map
      },
      getOpacity: () => 1,
    };

    this.layers.set(config.id, layer);
    return layer;
  }

  /**
   * Remove layer
   */
  public removeLayer(layerId: string): boolean {
    const layer = this.layers.get(layerId);
    if (!layer) return false;

    return this.layers.delete(layerId);
  }

  /**
   * Get layer
   */
  public getLayer(layerId: string): LayerInstance | undefined {
    return this.layers.get(layerId);
  }

  /**
   * Get all layers
   */
  public getLayers(): LayerInstance[] {
    return Array.from(this.layers.values());
  }

  /**
   * Add source
   */
  public addSource(id: string, source: MapSource): void {
    if (!this.isInitialized || !this.mapInstance) {
      throw new Error('Map not initialized');
    }

    this.sources.set(id, source);
  }

  /**
   * Remove source
   */
  public removeSource(sourceId: string): boolean {
    return this.sources.delete(sourceId);
  }

  /**
   * Get source
   */
  public getSource(sourceId: string): MapSource | undefined {
    return this.sources.get(sourceId);
  }

  /**
   * Add GeoJSON source
   */
  public addGeoJSONSource(id: string, data: GeoJSONFeature | GeoJSONFeatureCollection): void {
    this.addSource(id, {
      id,
      type: 'geojson',
      data,
    });
  }

  /**
   * Update GeoJSON source data
   */
  public updateGeoJSONSource(id: string, data: GeoJSONFeature | GeoJSONFeatureCollection): void {
    const source = this.getSource(id);
    if (!source) {
      throw new Error(`Source ${id} not found`);
    }

    source.data = data;
  }

  /**
   * Set map center
   */
  public setCenter(coordinates: [number, number], zoom?: number, duration: number = 1000): void {
    if (!this.isInitialized || !this.mapInstance) {
      throw new Error('Map not initialized');
    }

    if (!maptilerConfig.validateCoordinates(coordinates)) {
      throw new Error('Invalid coordinates');
    }

    this.mapInstance.flyTo({
      center: coordinates,
      zoom,
      duration,
    });
  }

  /**
   * Get map center
   */
  public getCenter(): [number, number] {
    if (!this.isInitialized || !this.mapInstance) {
      throw new Error('Map not initialized');
    }

    const center = this.mapInstance.getCenter();
    return [center.lng, center.lat];
  }

  /**
   * Set zoom level
   */
  public setZoom(zoom: number, duration: number = 1000): void {
    if (!this.isInitialized || !this.mapInstance) {
      throw new Error('Map not initialized');
    }

    this.mapInstance.easeTo({
      zoom,
      duration,
    });
  }

  /**
   * Get zoom level
   */
  public getZoom(): number {
    if (!this.isInitialized || !this.mapInstance) {
      throw new Error('Map not initialized');
    }

    return this.mapInstance.getZoom();
  }

  /**
   * Fit bounds
   */
  public fitBounds(bounds: [number, number, number, number], options?: Record<string, unknown>): void {
    if (!this.isInitialized || !this.mapInstance) {
      throw new Error('Map not initialized');
    }

    if (!maptilerConfig.validateBounds(bounds)) {
      throw new Error('Invalid bounds');
    }

    this.mapInstance.fitBounds(bounds, options);
  }

  /**
   * Get bounds
   */
  public getBounds(): Bounds {
    if (!this.isInitialized || !this.mapInstance) {
      throw new Error('Map not initialized');
    }

    const bounds = this.mapInstance.getBounds();
    return {
      minX: bounds.getWest(),
      minY: bounds.getSouth(),
      maxX: bounds.getEast(),
      maxY: bounds.getNorth(),
    };
  }

  /**
   * Set pitch (3D angle)
   */
  public setPitch(pitch: number, duration: number = 1000): void {
    if (!this.isInitialized || !this.mapInstance) {
      throw new Error('Map not initialized');
    }

    this.mapInstance.easeTo({
      pitch,
      duration,
    });
  }

  /**
   * Get pitch
   */
  public getPitch(): number {
    if (!this.isInitialized || !this.mapInstance) {
      throw new Error('Map not initialized');
    }

    return this.mapInstance.getPitch();
  }

  /**
   * Set bearing (rotation)
   */
  public setBearing(bearing: number, duration: number = 1000): void {
    if (!this.isInitialized || !this.mapInstance) {
      throw new Error('Map not initialized');
    }

    this.mapInstance.easeTo({
      bearing,
      duration,
    });
  }

  /**
   * Get bearing
   */
  public getBearing(): number {
    if (!this.isInitialized || !this.mapInstance) {
      throw new Error('Map not initialized');
    }

    return this.mapInstance.getBearing();
  }

  /**
   * Change style
   */
  public setStyle(styleUrl: string): void {
    if (!this.isInitialized || !this.mapInstance) {
      throw new Error('Map not initialized');
    }

    this.mapInstance.setStyle(styleUrl);
  }

  /**
   * Get current style
   */
  public getStyle(): string {
    return this.currentStyle;
  }

  /**
   * Add control
   */
  public addControl(control: unknown, position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'): void {
    if (!this.isInitialized || !this.mapInstance) {
      throw new Error('Map not initialized');
    }

    this.mapInstance.addControl(control, position);
  }

  /**
   * Remove control
   */
  public removeControl(control: unknown): void {
    if (!this.isInitialized || !this.mapInstance) {
      throw new Error('Map not initialized');
    }

    this.mapInstance.removeControl(control);
  }

  /**
   * Get map statistics
   */
  public getStatistics(): MapStatistics {
    return {
      markersCount: this.markers.size,
      layersCount: this.layers.size,
      sourcesCount: this.sources.size,
      isLoaded: this.isInitialized,
      bounds: this.isInitialized ? this.getBounds() : undefined,
    };
  }

  /**
   * Check if map is initialized
   */
  public isMapInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get raw map instance
   */
  public getMapInstance(): any {
    if (!this.isInitialized) {
      throw new Error('Map not initialized');
    }
    return this.mapInstance;
  }

  /**
   * Destroy map
   */
  public destroy(): void {
    if (this.mapInstance) {
      this.clearMarkers();
      this.layers.clear();
      this.sources.clear();
      this.eventListeners.clear();
      this.mapInstance.remove();
      this.mapInstance = null;
    }

    this.isInitialized = false;
  }

  /**
   * Reset service
   */
  public reset(): void {
    this.destroy();
  }
}

/**
 * Export singleton instance
 */
export const mapService = MapService.getInstance();
