import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { api } from '../api/client';
import { TrackedObject, Zone } from '../api/types';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import './MapView.css';

interface MapViewProps {
    onObjectSelect: (obj: TrackedObject | null) => void;
    onObjectsUpdate?: (objects: TrackedObject[]) => void;
    onZonesUpdate?: (zones: Zone[]) => void;
    onClearSelection?: () => void;
    selectedObjectId?: string | null;
    selectedZoneId?: number | null;
    drawTrigger?: number;
    zoneRefreshTrigger?: number;
}

export const MapView: React.FC<MapViewProps> = ({
    onObjectSelect,
    onObjectsUpdate,
    onZonesUpdate,
    onClearSelection,
    selectedObjectId,
    selectedZoneId,
    drawTrigger,
    zoneRefreshTrigger
}) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const draw = useRef<MapboxDraw | null>(null);
    const markers = useRef<{ [key: string]: maplibregl.Marker }>({});
    const onObjectSelectRef = useRef(onObjectSelect);
    const onClearSelectionRef = useRef(onClearSelection);

    // Update refs when props change
    useEffect(() => {
        onObjectSelectRef.current = onObjectSelect;
        onClearSelectionRef.current = onClearSelection;
    }, [onObjectSelect, onClearSelection]);

    // Initialize Map
    useEffect(() => {
        if (map.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current!,
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
            zoom: 3,
            pitch: 45,
        });

        draw.current = new MapboxDraw({
            displayControlsDefault: false,
            controls: {
                polygon: false,
                trash: false
            },
            defaultMode: 'simple_select'
        });

        map.current.addControl(draw.current as any, 'top-left');

        map.current.on('draw.create', async (e) => {
            const feature = e.features[0];
            if (feature.geometry.type === 'Polygon') {
                const name = prompt("Enter Zone Name:", "New Zone") || "Unnamed Zone";
                const coords = feature.geometry.coordinates[0]; // [ [lon, lat], ... ]
                // Convert to [[lat, lon], ...] for backend compatibility if desired, 
                // but let's stick to [[lat, lon]] as stored in backend models.py plan.
                const latLonCoords = coords.map((c: number[]) => [c[1], c[0]]);

                try {
                    await api.createZone({
                        name,
                        is_polygon: true,
                        polygon_coords: JSON.stringify(latLonCoords),
                        enabled: true
                    });
                    loadZones(); // Refresh zones
                    draw.current?.deleteAll(); // Clear the drawn temporary shape
                } catch (err) {
                    console.error("Failed to create zone", err);
                }
            }
        });

        map.current.on('load', () => {
            loadZones();
        });

        map.current.on('click', (e) => {
            console.log("Map background clicked");
            if (onClearSelectionRef.current) {
                onClearSelectionRef.current();
            }
        });

    }, []);

    // Polling Loop for Objects
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const objects = await api.getObjects();
                updateMarkers(objects);
                updateTrails(objects);
                if (onObjectsUpdate) {
                    onObjectsUpdate(objects);
                }
            } catch (e) {
                console.error("Polling error", e);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [onObjectsUpdate]);

    // Trigger Drawing Mode from Sidebar
    useEffect(() => {
        if (drawTrigger && drawTrigger > 0 && draw.current) {
            draw.current.changeMode('draw_polygon');
        }
    }, [drawTrigger]);

    // Fly to selected object
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


    useEffect(() => {
        if (zoneRefreshTrigger && zoneRefreshTrigger > 0) {
            loadZones();
        }
    }, [zoneRefreshTrigger]);

    // Fly to selected zone
    useEffect(() => {
        if (!map.current || !selectedZoneId) return;

        const flyToZone = async () => {
            try {
                const zones = await api.getZones();
                const zone = zones.find(z => z.id === selectedZoneId);
                if (!zone) return;

                let center: [number, number];
                if (zone.is_polygon && zone.polygon_coords) {
                    const coords = JSON.parse(zone.polygon_coords) as number[][];
                    // Calculate centroid
                    const lats = coords.map(c => c[0]);
                    const lons = coords.map(c => c[1]);
                    const avgLat = lats.reduce((a, b) => a + b) / lats.length;
                    const avgLon = lons.reduce((a, b) => a + b) / lons.length;
                    center = [avgLon, avgLat];
                } else if (zone.min_lon !== undefined && zone.max_lon !== undefined && zone.min_lat !== undefined && zone.max_lat !== undefined) {
                    center = [(zone.min_lon + zone.max_lon) / 2, (zone.min_lat + zone.max_lat) / 2];
                } else {
                    return;
                }

                map.current?.flyTo({
                    center: center,
                    zoom: 14,
                    duration: 1500
                });
            } catch (e) {
                console.error("Failed to fly to zone", e);
            }
        };

        flyToZone();
    }, [selectedZoneId]);

    // Update Trails
    const updateTrails = async (objects: TrackedObject[]) => {
        if (!map.current) return;

        for (const obj of objects) {
            try {
                const history = await api.getHistory(obj.id, 30);
                if (history.length < 2) continue;

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
                    (map.current.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geoData);
                } else {
                    map.current.addSource(sourceId, { type: 'geojson', data: geoData });

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

    // Load Zones
    const loadZones = async () => {
        try {
            const z = await api.getZones();
            renderZones(z);
            if (onZonesUpdate) {
                onZonesUpdate(z);
            }
        } catch (e) { console.error(e); }
    };

    const renderZones = (zones: Zone[]) => {
        if (!map.current) return;

        const features = zones.map(z => {
            let coordinates: any = [];
            if (z.is_polygon && z.polygon_coords) {
                const coords = JSON.parse(z.polygon_coords);
                // Backend: [[lat, lon], ...], Frontend: [[lon, lat], ...]
                coordinates = [coords.map((c: any) => [c[1], c[0]])];
            } else if (z.min_lat !== undefined && z.min_lon !== undefined) {
                coordinates = [[
                    [z.min_lon, z.min_lat],
                    [z.max_lon, z.min_lat],
                    [z.max_lon, z.max_lat],
                    [z.min_lon, z.max_lat],
                    [z.min_lon, z.min_lat]
                ]];
            }

            return {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: coordinates
                },
                properties: { name: z.name, id: z.id }
            };
        });

        const sourceId = 'zones-data';
        if (map.current.getSource(sourceId)) {
            (map.current.getSource(sourceId) as maplibregl.GeoJSONSource).setData({
                type: 'FeatureCollection',
                features: features as any
            });
        } else {
            map.current.addSource(sourceId, {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: features as any }
            });

            map.current.addLayer({
                id: 'zones-fill',
                type: 'fill',
                source: sourceId,
                paint: {
                    'fill-color': '#0891b2',
                    'fill-opacity': 0.2
                }
            });

            map.current.addLayer({
                id: 'zones-outline',
                type: 'line',
                source: sourceId,
                paint: {
                    'line-color': '#06b6d4',
                    'line-width': 2
                }
            });
        }
    };

    const updateMarkers = (objects: TrackedObject[]) => {
        if (!map.current) return;

        // Add/Update markers
        objects.forEach(obj => {
            if (!markers.current[obj.id]) {
                // Create new marker
                const el = document.createElement('div');
                el.className = 'marker';
                el.addEventListener('click', (e) => {
                    console.log(`Marker clicked: ${obj.id}`);
                    e.stopPropagation();
                    onObjectSelectRef.current(obj);
                });

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
