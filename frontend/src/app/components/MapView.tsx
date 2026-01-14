import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { api } from '../api/client';
import { TrackedObject, Zone } from '../api/types';
import './MapView.css';

interface MapViewProps {
    onObjectSelect: (obj: TrackedObject | null) => void;
    onObjectsUpdate?: (objects: TrackedObject[]) => void;
    selectedObjectId?: string | null;
}

export const MapView: React.FC<MapViewProps> = ({ onObjectSelect, onObjectsUpdate, selectedObjectId }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const markers = useRef<{ [key: string]: maplibregl.Marker }>({});

    // State for data

    // Initialize Map
    useEffect(() => {
        if (map.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current!,
            // Use inline style to avoid external CORS/Rate-limiting issues
            style: {
                version: 8,
                sources: {
                    'carto-dark': {
                        type: 'raster',
                        tiles: [
                            'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                            'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                            'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                            'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'
                        ],
                        tileSize: 256,
                        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    }
                },
                layers: [{
                    id: 'carto-dark-layer',
                    type: 'raster',
                    source: 'carto-dark',
                    minzoom: 0,
                    maxzoom: 22
                }]
            },
            center: [-68.5170, 63.7467], // Iqaluit
            zoom: 3, // Zoom out to show context (Baffin Island/Canada)
            pitch: 45,
        });

        map.current.on('error', (e) => {
            console.error("MapLibre Error:", e);
        });

        map.current.on('load', () => {
            // Add dark overlay if style is too bright, or load custom dark style
            // For MVP, we'll stick to basic style but maybe tweak colors if possible
            loadZones();
        });

    }, []);

    // Polling Loop for Objects
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const objects = await api.getObjects();
                updateMarkers(objects);
                updateTrails(objects);
                // Notify parent of new data
                if (onObjectsUpdate) {
                    onObjectsUpdate(objects);
                }
            } catch (e) {
                console.error("Polling error", e);
            }
        }, 1000); // 1Hz

        return () => clearInterval(interval);
    }, [onObjectsUpdate]);

    // Fly to selected object when selectedObjectId changes
    useEffect(() => {
        if (!map.current || !selectedObjectId) return;

        const marker = markers.current[selectedObjectId];
        if (marker) {
            const lngLat = marker.getLngLat();
            map.current.flyTo({
                center: [lngLat.lng, lngLat.lat],
                zoom: 13,
                duration: 1000
            });
        }
    }, [selectedObjectId]);


    // Update Trails for all objects
    const updateTrails = async (objects: TrackedObject[]) => {
        if (!map.current) return;

        for (const obj of objects) {
            try {
                const history = await api.getHistory(obj.id, 30);
                if (history.length < 2) continue;

                // Sort by timestamp ascending for correct line order
                const sorted = history.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
                const coordinates = sorted.map(r => [r.lon, r.lat]);

                const sourceId = `trail-${obj.id}`;
                const layerId = `trail-layer-${obj.id}`;

                const geoData: GeoJSON.FeatureCollection = {
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: coordinates
                        },
                        properties: { objectId: obj.id }
                    }]
                };

                if (map.current.getSource(sourceId)) {
                    // Update existing source
                    (map.current.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geoData);
                } else {
                    // Create new source and layer
                    map.current.addSource(sourceId, { type: 'geojson', data: geoData });

                    // Choose color based on object type
                    let color = '#fca5a5';
                    if (obj.id.includes('drone')) color = '#fbbf24';
                    if (obj.id.includes('vehicle')) color = '#34d399';

                    map.current.addLayer({
                        id: layerId,
                        type: 'line',
                        source: sourceId,
                        paint: {
                            'line-color': color,
                            'line-width': 2,
                            'line-opacity': 0.6
                        }
                    });
                }
            } catch (e) {
                console.error(`Failed to update trail for ${obj.id}`, e);
            }
        }
    };

    // Load Zones once
    const loadZones = async () => {
        try {
            const z = await api.getZones();
            // setZones(z);
            renderZones(z);
        } catch (e) { console.error(e); }
    };

    const renderZones = (zones: Zone[]) => {
        if (!map.current) return;

        // Simple GeoJSON for zones
        const features = zones.map(z => ({
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [z.min_lon, z.min_lat],
                    [z.max_lon, z.min_lat],
                    [z.max_lon, z.max_lat],
                    [z.min_lon, z.max_lat],
                    [z.min_lon, z.min_lat]
                ]]
            },
            properties: { name: z.name }
        }));

        map.current.addSource('zones', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: features as any }
        });

        map.current.addLayer({
            id: 'zones-fill',
            type: 'fill',
            source: 'zones',
            paint: {
                'fill-color': '#0891b2', // Cyan
                'fill-opacity': 0.2
            }
        });

        map.current.addLayer({
            id: 'zones-outline',
            type: 'line',
            source: 'zones',
            paint: {
                'line-color': '#06b6d4',
                'line-width': 2
            }
        });
    };

    const updateMarkers = (objects: TrackedObject[]) => {
        if (!map.current) return;

        // Add/Update markers
        objects.forEach(obj => {
            if (!markers.current[obj.id]) {
                // Create new marker
                const el = document.createElement('div');
                el.className = 'marker';
                el.onclick = () => onObjectSelect(obj);

                // Simple style for now
                el.style.backgroundColor = '#fca5a5'; // Red-300 default
                if (obj.id.includes('drone')) el.style.backgroundColor = '#fbbf24'; // Amber
                if (obj.id.includes('vehicle')) el.style.backgroundColor = '#34d399'; // Green

                markers.current[obj.id] = new maplibregl.Marker({ element: el })
                    .setLngLat([obj.last_lon, obj.last_lat])
                    .addTo(map.current!);
            } else {
                // Animate to new position
                markers.current[obj.id].setLngLat([obj.last_lon, obj.last_lat]);
            }
        });
    };

    return <div ref={mapContainer} className="map-container" />;
};
