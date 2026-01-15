import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { api } from '../api/client';
import { TrackedObject, Zone } from '../api/types';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { Check, X, MapPin } from 'lucide-react';
import { isAssetStale } from '../utils';
import './MapView.css';

interface MapViewProps {
    onObjectSelect: (obj: TrackedObject | null) => void;
    onZoneSelect: (zone: Zone) => void;
    onObjectsUpdate?: (objects: TrackedObject[]) => void;
    onZonesUpdate?: (zones: Zone[]) => void;
    onClearSelection?: () => void;
    selectedObjectId?: string | null;
    followedObjectId?: string | null;
    selectedZoneId?: number | null;
    drawTrigger?: number;
    zoneRefreshTrigger?: number;
}

export const MapView: React.FC<MapViewProps> = ({
    onObjectSelect,
    onZoneSelect,
    onObjectsUpdate,
    onZonesUpdate,
    onClearSelection,
    selectedObjectId,
    followedObjectId,
    selectedZoneId,
    drawTrigger,
    zoneRefreshTrigger
}) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const draw = useRef<MapboxDraw | null>(null);
    const markers = useRef<{ [key: string]: maplibregl.Marker }>({});
    const zonesRef = useRef<Zone[]>([]);
    const onObjectSelectRef = useRef(onObjectSelect);
    const onZoneSelectRef = useRef(onZoneSelect);
    const onClearSelectionRef = useRef(onClearSelection);

    // Editing State
    const [isEditingZone, setIsEditingZone] = useState(false);
    const [editingZoneName, setEditingZoneName] = useState('New Zone');
    const [editingZoneColor, setEditingZoneColor] = useState('#06b6d4');
    const [tempCoords, setTempCoords] = useState<number[][] | null>(null);

    // Map Style State
    const [mapStyle, setMapStyle] = useState<'dark' | 'topo' | 'weather'>('dark');
    const [weatherData, setWeatherData] = useState<{ host: string, path: string } | null>(null);

    // Fetch Weather Data
    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
                const data = await res.json();
                // Get the last "past" frame or "nowcast"
                if (data.radar && data.radar.past && data.radar.past.length > 0) {
                    const lastFrame = data.radar.past[data.radar.past.length - 1];
                    setWeatherData({
                        host: data.host || 'https://tilecache.rainviewer.com',
                        path: lastFrame.path
                    });
                }
            } catch (error) {
                console.error("Failed to fetch weather data", error);
            }
        };
        fetchWeather();
    }, []);

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
                    },
                    'opentopo': {
                        type: 'raster',
                        tiles: [
                            'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
                            'https://b.tile.opentopomap.org/{z}/{x}/{y}.png',
                            'https://c.tile.opentopomap.org/{z}/{x}/{y}.png'
                        ],
                        tileSize: 256,
                        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
                    }
                },
                layers: [
                    {
                        id: 'carto-dark-layer',
                        type: 'raster',
                        source: 'carto-dark',
                        minzoom: 0,
                        maxzoom: 22,
                        layout: {
                            visibility: 'visible'
                        }
                    },
                    {
                        id: 'opentopo-layer',
                        type: 'raster',
                        source: 'opentopo',
                        minzoom: 0,
                        maxzoom: 17,
                        layout: {
                            visibility: 'none'
                        }
                    }
                ]
            },
            center: [-68.5170, 63.7467], // Iqaluit
            zoom: 3,
            pitch: 45,
        });

        // Only overriding the specific styles causing issues (lines)
        const customStyles = [
            // ACTIVE (being drawn)
            // line stroke
            {
                "id": "gl-draw-line-active.cold",
                "type": "line",
                "filter": ["all", ["==", "$type", "LineString"], ["==", "active", "false"], ["==", "mode", "simple_select"]],
                "layout": {
                    "line-cap": "round",
                    "line-join": "round"
                },
                "paint": {
                    "line-color": "#3bb2d0",
                    "line-width": 2
                }
            },
            {
                "id": "gl-draw-line-active.hot",
                "type": "line",
                "filter": ["all", ["==", "$type", "LineString"], ["==", "active", "true"]],
                "layout": {
                    "line-cap": "round",
                    "line-join": "round"
                },
                "paint": {
                    "line-color": "#fbb03b",
                    "line-dasharray": ["literal", [0.2, 2]],
                    "line-width": 2
                }
            },
            // polygon stroke
            {
                "id": "gl-draw-polygon-stroke-active",
                "type": "line",
                "filter": ["all", ["==", "$type", "Polygon"], ["==", "active", "true"]],
                "layout": {
                    "line-cap": "round",
                    "line-join": "round"
                },
                "paint": {
                    "line-color": "#fbb03b",
                    "line-dasharray": ["literal", [0.2, 2]],
                    "line-width": 2
                }
            },
            // INACTIVE (static)
            {
                "id": "gl-draw-line-static",
                "type": "line",
                "filter": ["all", ["==", "$type", "LineString"], ["==", "mode", "static"]],
                "layout": {
                    "line-cap": "round",
                    "line-join": "round"
                },
                "paint": {
                    "line-color": "#404040",
                    "line-width": 2
                }
            },
            {
                "id": "gl-draw-polygon-stroke-static",
                "type": "line",
                "filter": ["all", ["==", "$type", "Polygon"], ["==", "mode", "static"]],
                "layout": {
                    "line-cap": "round",
                    "line-join": "round"
                },
                "paint": {
                    "line-color": "#404040",
                    "line-width": 2
                }
            },
            {
                "id": "gl-draw-polygon-fill-static",
                "type": "fill",
                "filter": ["all", ["==", "$type", "Polygon"], ["==", "mode", "static"]],
                "paint": {
                    "fill-color": "#404040",
                    "fill-outline-color": "#404040",
                    "fill-opacity": 0.1
                }
            },
            {
                "id": "gl-draw-polygon-fill-active",
                "type": "fill",
                "filter": ["all", ["==", "$type", "Polygon"], ["==", "active", "true"]],
                "paint": {
                    "fill-color": "#fbb03b",
                    "fill-outline-color": "#fbb03b",
                    "fill-opacity": 0.1
                }
            },
            {
                "id": "gl-draw-polygon-midpoint",
                "type": "circle",
                "filter": ["all", ["==", "$type", "Point"], ["==", "meta", "midpoint"]],
                "paint": {
                    "circle-radius": 3,
                    "circle-color": "#fbb03b"
                }
            },
            {
                "id": "gl-draw-polygon-and-line-vertex-stroke-active",
                "type": "circle",
                "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
                "paint": {
                    "circle-radius": 5,
                    "circle-color": "#fff"
                }
            },
            {
                "id": "gl-draw-polygon-and-line-vertex-active",
                "type": "circle",
                "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
                "paint": {
                    "circle-radius": 3,
                    "circle-color": "#fbb03b"
                }
            },
            {
                "id": "gl-draw-line-inactive",
                "type": "line",
                "filter": ["all", ["==", "active", "false"], ["==", "$type", "LineString"], ["!=", "mode", "static"]],
                "layout": {
                    "line-cap": "round",
                    "line-join": "round"
                },
                "paint": {
                    "line-color": "#3bb2d0",
                    "line-width": 2
                }
            },
            {
                "id": "gl-draw-polygon-stroke-inactive",
                "type": "line",
                "filter": ["all", ["==", "active", "false"], ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
                "layout": {
                    "line-cap": "round",
                    "line-join": "round"
                },
                "paint": {
                    "line-color": "#3bb2d0",
                    "line-width": 2
                }
            },
            {
                "id": "gl-draw-polygon-fill-inactive",
                "type": "fill",
                "filter": ["all", ["==", "active", "false"], ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
                "paint": {
                    "fill-color": "#3bb2d0",
                    "fill-outline-color": "#3bb2d0",
                    "fill-opacity": 0.1
                }
            }
        ];

        draw.current = new MapboxDraw({
            displayControlsDefault: false,
            controls: {
                polygon: false,
                trash: false
            },
            defaultMode: 'simple_select',
            styles: customStyles
        });

        // @ts-ignore
        map.current.addControl(draw.current, 'top-left');

        map.current.on('draw.create', (e) => {
            const feature = e.features[0];
            if (feature.geometry.type === 'Polygon') {
                const coords = feature.geometry.coordinates[0]; // [ [lon, lat], ... ]
                // Convert to [[lat, lon], ...] for backend
                const latLonCoords = coords.map((c: number[]) => [c[1], c[0]]);
                setTempCoords(latLonCoords);
            }
        });

        // Add proper load handler
        map.current.on('load', () => {
            loadZones();
        });

        map.current.on('click', (e) => {
            // Only clear if clicking on background (not a feature)
            // But 'click' on map fires for everything.
            // We can check if defaultPrevented or stopPropagation was called?
            // MapLibre doesn't strictly support stopPropagation from layer to map easily without checking features at point.
            // However, layer click fires first?
            // Let's check if the click target suggests a feature.
            const features = map.current?.queryRenderedFeatures(e.point, { layers: ['zones-fill'] });
            if (!features || features.length === 0) {
                console.log("Map background clicked");
                if (onClearSelectionRef.current) {
                    onClearSelectionRef.current();
                }
            }
        });

        // Zone Click Handler
        map.current.on('click', 'zones-fill', (e) => {
            if (e.features && e.features.length > 0) {
                const feature = e.features[0];
                const zoneId = feature.properties?.id;
                // Find full zone object
                const zone = zonesRef.current.find(z => z.id === zoneId);
                if (zone && onZoneSelectRef.current) {
                    onZoneSelectRef.current(zone);
                }
            }
        });

        // Zone Hover Effects
        map.current.on('mouseenter', 'zones-fill', () => {
            if (map.current) map.current.getCanvas().style.cursor = 'pointer';
        });

        map.current.on('mouseleave', 'zones-fill', () => {
            if (map.current) map.current.getCanvas().style.cursor = '';
        });

    }, []);

    // Create Weather Layer when path is available
    useEffect(() => {
        if (!map.current || !weatherData) return;

        const addWeatherLayer = () => {
            if (!map.current) return;
            const sourceId = 'rainviewer';
            const layerId = 'rainviewer-layer';

            if (!map.current.getSource(sourceId)) {
                map.current.addSource(sourceId, {
                    type: 'raster',
                    tiles: [
                        `${weatherData.host}${weatherData.path}/256/{z}/{x}/{y}/2/1_1.png`
                    ],
                    tileSize: 256
                });

                map.current.addLayer({
                    id: layerId,
                    type: 'raster',
                    source: sourceId,
                    paint: {
                        'raster-opacity': 0.7
                    },
                    layout: {
                        visibility: 'none'
                    }
                });

                // If we're already in weather mode, show it
                if (mapStyle === 'weather') {
                    map.current.setLayoutProperty(layerId, 'visibility', 'visible');
                }
            }
        };

        if (map.current.isStyleLoaded()) {
            addWeatherLayer();
        } else {
            map.current.once('load', addWeatherLayer);
        }
    }, [weatherData]);

    // Handle Style Switch
    useEffect(() => {
        if (!map.current) return;

        const hasDark = map.current.getLayer('carto-dark-layer');
        const hasTopo = map.current.getLayer('opentopo-layer');
        const hasWeather = map.current.getLayer('rainviewer-layer');

        if (mapStyle === 'dark') {
            if (hasDark) map.current.setLayoutProperty('carto-dark-layer', 'visibility', 'visible');
            if (hasTopo) map.current.setLayoutProperty('opentopo-layer', 'visibility', 'none');
            if (hasWeather) map.current.setLayoutProperty('rainviewer-layer', 'visibility', 'none');
        } else if (mapStyle === 'topo') {
            if (hasDark) map.current.setLayoutProperty('carto-dark-layer', 'visibility', 'none');
            if (hasTopo) map.current.setLayoutProperty('opentopo-layer', 'visibility', 'visible');
            if (hasWeather) map.current.setLayoutProperty('rainviewer-layer', 'visibility', 'none');
        } else if (mapStyle === 'weather') {
            // Weather is Dark base + Weather layer
            if (hasDark) map.current.setLayoutProperty('carto-dark-layer', 'visibility', 'visible');
            if (hasTopo) map.current.setLayoutProperty('opentopo-layer', 'visibility', 'none');
            if (hasWeather) map.current.setLayoutProperty('rainviewer-layer', 'visibility', 'visible');
        }
    }, [mapStyle]);

    // Polling Loop for Objects
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const objects = await api.getObjects();
                updateMarkers(objects);
                updateTrails(objects);

                // Follow Logic
                if (followedObjectId && map.current) {
                    const obj = objects.find(o => o.id === followedObjectId);
                    if (obj) {
                        map.current.easeTo({
                            center: [obj.last_lon, obj.last_lat],
                            // zoom: 13, // Removed to allow user zooming
                            duration: 1000,
                            easing: (t) => t
                        });
                    }
                }

                if (onObjectsUpdate) {
                    onObjectsUpdate(objects);
                }
            } catch (e) {
                console.error("Polling error", e);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [onObjectsUpdate, followedObjectId]);

    // Trigger Drawing Mode from Sidebar
    useEffect(() => {
        if (drawTrigger && drawTrigger > 0 && draw.current) {
            draw.current.changeMode('draw_polygon');
            setIsEditingZone(true);
            setEditingZoneName(`Zone ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
            setEditingZoneColor('#06b6d4');
            setTempCoords(null);
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

                const bounds = new maplibregl.LngLatBounds();

                if (zone.is_polygon && zone.polygon_coords) {
                    const coords = JSON.parse(zone.polygon_coords) as number[][];
                    // Coords are [lat, lon] from backend (python)
                    // Extend bounds with [lon, lat] for MapLibre
                    coords.forEach(c => bounds.extend([c[1], c[0]]));
                } else if (zone.min_lon !== undefined && zone.max_lon !== undefined && zone.min_lat !== undefined && zone.max_lat !== undefined) {
                    bounds.extend([zone.min_lon, zone.min_lat]);
                    bounds.extend([zone.max_lon, zone.max_lat]);
                } else {
                    return;
                }

                if (map.current) {
                    map.current.fitBounds(bounds, {
                        padding: { top: 50, bottom: 50, left: 50, right: 350 }, // Extra right padding for sidebar
                        duration: 1500
                    });
                }

            } catch (e) {
                console.error("Failed to fly to zone", e);
            }
        };

        flyToZone();
    }, [selectedZoneId]);

    // Selected Object History Tail
    useEffect(() => {
        const updateSelectedHistory = async () => {
            if (!map.current) return;

            const sourceId = 'selected-history';
            const layerId = 'selected-history-layer';

            // Clean up if no object selected
            if (!selectedObjectId) {
                if (map.current.getSource(sourceId)) {
                    (map.current.getSource(sourceId) as maplibregl.GeoJSONSource).setData({
                        type: 'FeatureCollection',
                        features: []
                    });
                }
                return;
            }

            try {
                // Fetch longer history for valid context
                const history = await api.getHistory(selectedObjectId, 1000);
                // Sort by timestamp
                const sorted = history.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
                const coordinates = sorted.map(r => [r.lon, r.lat]);

                const geoData: GeoJSON.FeatureCollection = {
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: coordinates
                        },
                        properties: {}
                    }]
                };

                if (map.current.getSource(sourceId)) {
                    (map.current.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geoData);
                } else {
                    map.current.addSource(sourceId, { type: 'geojson', data: geoData });

                    // Add layer before markers but maybe after tiles?
                    // If we don't specify strict order, it might overlay others.
                    // We want it visually behind the active "hot" trails (which are added dynamically).
                    // The active trails are added with `map.current.nextLayerId` implied order.
                    // We'll add this one and move it to bottom if needed, or rely on distinct styling.
                    map.current.addLayer({
                        id: layerId,
                        type: 'line',
                        source: sourceId,
                        layout: {
                            'line-join': 'round',
                            'line-cap': 'round'
                        },
                        paint: {
                            'line-color': '#9ca3af', // gray-400
                            'line-width': 2,
                            'line-opacity': 0.8,
                            'line-dasharray': [2, 1] // Optional aesthetic
                        }
                    });

                    // Move it behind others if possible
                    // map.current.moveLayer(layerId, 'first-marker-layer-id'); // We don't have a stable marker layer ID reference yet
                }
            } catch (e) {
                console.error("Failed to update selected history", e);
            }
        };

        updateSelectedHistory();
    }, [selectedObjectId]);

    // Update Trails
    const updateTrails = async (objects: TrackedObject[]) => {
        if (!map.current || !map.current.isStyleLoaded()) return;

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
            zonesRef.current = z;
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
                properties: { name: z.name, id: z.id, color: z.color || '#06b6d4' }
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
                    'fill-color': ['get', 'color'],
                    'fill-opacity': 0.2
                }
            });

            map.current.addLayer({
                id: 'zones-outline',
                type: 'line',
                source: sourceId,
                paint: {
                    'line-color': ['get', 'color'],
                    'line-width': 2
                }
            });
        }
    };

    const updateMarkers = (objects: TrackedObject[]) => {
        if (!map.current) return;

        // Add/Update markers
        objects.forEach(obj => {
            let marker = markers.current[obj.id];

            if (!marker) {
                // Create new marker
                const el = document.createElement('div');
                el.className = 'marker';
                // Navigation Arrow SVG
                el.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" style="width: 100%; height: 100%; display: block; filter: drop-shadow(0 0 2px rgba(0,0,0,0.5));"><path d="M12 2L4.5 20.29C4.24 20.89 4.96 21.46 5.51 21.11L12 17.5L18.49 21.11C19.04 21.46 19.76 20.89 19.5 20.29L12 2Z" /></svg>`;

                el.addEventListener('click', (e) => {
                    console.log(`Marker clicked: ${obj.id}`);
                    e.stopPropagation();
                    onObjectSelectRef.current(obj);
                });

                marker = new maplibregl.Marker({ element: el })
                    .setLngLat([obj.last_lon, obj.last_lat])
                    .setRotationAlignment('map')
                    .addTo(map.current!);
                markers.current[obj.id] = marker;
            } else {
                // Animate to new position
                marker.setLngLat([obj.last_lon, obj.last_lat]);
            }

            // Update Rotation
            marker.setRotation(obj.heading_deg || 0);

            // Update Style (every tick)
            const el = marker.getElement();
            const isStale = isAssetStale(obj);

            // Set color on the container, which SVG inherits via currentColor
            if (isStale) {
                el.style.color = '#9ca3af'; // Gray-400
            } else {
                let color = '#fca5a5'; // Red-300 default
                if (obj.id.includes('drone')) color = '#fbbf24'; // Amber
                if (obj.id.includes('vehicle')) color = '#34d399'; // Green
                el.style.color = color;
            }
            // Ensure background is transparent for the arrow shape
            el.style.backgroundColor = 'transparent';
        });
    };

    const handleSaveZone = async () => {
        if (!tempCoords) {
            alert("Please draw a zone on the map first.");
            return;
        }

        try {
            await api.createZone({
                name: editingZoneName,
                is_polygon: true,
                polygon_coords: JSON.stringify(tempCoords),
                enabled: true,
                color: editingZoneColor
            });
            setIsEditingZone(false);
            setTempCoords(null);
            draw.current?.deleteAll();
            draw.current?.changeMode('simple_select');
            loadZones();
        } catch (err) {
            console.error("Failed to save zone", err);
        }
    };

    const handleCancelEdit = () => {
        setIsEditingZone(false);
        setTempCoords(null);
        draw.current?.deleteAll();
        draw.current?.changeMode('simple_select');
    };

    return (
        <div className="map-wrapper">
            <div ref={mapContainer} className="map-container" />

            {/* Style Switcher */}
            <div className="map-style-switcher" style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                zIndex: 10,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                padding: '4px',
                borderRadius: '8px',
                display: 'flex',
                gap: '4px'
            }}>
                <button
                    onClick={() => setMapStyle('dark')}
                    style={{
                        backgroundColor: mapStyle === 'dark' ? '#06b6d4' : 'transparent',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '12px'
                    }}
                >
                    Dark
                </button>
                <button
                    onClick={() => setMapStyle('topo')}
                    style={{
                        backgroundColor: mapStyle === 'topo' ? '#06b6d4' : 'transparent',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '12px'
                    }}
                >
                    Topo
                </button>
                <button
                    onClick={() => setMapStyle('weather')}
                    style={{
                        backgroundColor: mapStyle === 'weather' ? '#06b6d4' : 'transparent',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '12px'
                    }}
                >
                    Weather
                </button>
            </div>

            {isEditingZone && (
                <div className="zone-editor-overlay">
                    <div className="zone-editor-card">
                        <div className="zone-editor-input-group">
                            <MapPin size={18} className="text-cyan-400" />
                            <input
                                type="text"
                                value={editingZoneName}
                                onChange={(e) => setEditingZoneName(e.target.value)}
                                placeholder="Zone Name"
                                className="zone-name-input"
                            />
                        </div>

                        <div className="zone-editor-divider" />

                        <div className="zone-color-picker">
                            {[
                                '#06b6d4', // Cyan
                                '#10b981', // Emerald
                                '#3b82f6', // Blue
                                '#8b5cf6', // Violet
                                '#ec4899', // Pink
                                '#ef4444', // Red
                                '#f59e0b', // Amber
                            ].map(color => (
                                <button
                                    key={color}
                                    className={`color-swatch ${editingZoneColor === color ? 'active' : ''}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setEditingZoneColor(color)}
                                />
                            ))}
                        </div>

                        <div className="zone-editor-divider" />

                        <div className="zone-editor-actions">
                            <button
                                className="action-button save"
                                onClick={handleSaveZone}
                                title="Save Zone"
                            >
                                <Check size={20} />
                            </button>
                            <button
                                className="action-button cancel"
                                onClick={handleCancelEdit}
                                title="Cancel"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                    {!tempCoords && (
                        <div className="editor-hint">
                            Click on the map to start drawing your zone polygon...
                        </div>
                    )}
                </div>
            )}

            {/* Topo Height Legend */}
            {mapStyle === 'topo' && (
                <div style={{
                    position: 'absolute',
                    bottom: '50px',
                    right: '10px',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    padding: '8px 4px',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    pointerEvents: 'none',
                    border: '1px solid #444',
                    zIndex: 20
                }}>
                    <div style={{ fontSize: '9px', textAlign: 'center', marginBottom: '2px', lineHeight: '1.2' }}>
                        Elevation<br />(m)
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch', height: '150px' }}>
                        {/* Color Bar */}
                        <div style={{
                            width: '12px',
                            height: '100%',
                            background: `linear-gradient(to top, 
                                #71a671 0%,   /* Low Green */
                                #f2e6b5 30%,  /* Beige */
                                #c9a478 60%,  /* Light Brown */
                                #875c36 85%,  /* Dark Brown */
                                #ffffff 100%  /* White */
                            )`
                            // Approximate OpenTopoMap: Green -> Beige/Yellow -> Light Brown -> Dark Brown -> White
                        }} />

                        {/* Labels */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            marginLeft: '4px',
                            fontSize: '9px',
                            textAlign: 'left'
                        }}>
                            <span>4000+</span>
                            <span>2000</span>
                            <span>1000</span>
                            <span>500</span>
                            <span>200</span>
                            <span>0</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Weather Legend */}
            {mapStyle === 'weather' && (
                <div style={{
                    position: 'absolute',
                    bottom: '50px',
                    right: '10px', // Bottom right
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    padding: '8px 4px',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    pointerEvents: 'none',
                    border: '1px solid #444',
                    zIndex: 20 // Ensure it's above map controls
                }}>
                    <div style={{ fontSize: '9px', textAlign: 'center', marginBottom: '2px', lineHeight: '1.2' }}>
                        Rain/Pluie<br />mm/hr
                    </div>

                    {/* Gradient Bar Container */}
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch', height: '150px' }}>
                        {/* dBZ Labels (Left side like reference or Right side depending on pref) 
                           User asked for "right side" labels in plan, but reference shows them on right of color bar usually?
                           Reference image actually has scale on left? No, reference shows labels on right.
                           Let's put labels on the right.
                        */}

                        {/* Color Bar */}
                        <div style={{
                            width: '12px',
                            height: '100%',
                            background: `linear-gradient(to top, 
                                #000000 0%,
                                #40e0d0 10%, 
                                #0000ff 30%, 
                                #00ff00 50%, 
                                #ffff00 70%, 
                                #ff0000 90%, 
                                #ff00ff 100%
                            )`
                            // Approximate radar colors: Black (None) -> Teal -> Blue -> Green -> Yellow -> Red -> Pink/Purple (Hail)
                            // Better stepped gradient per standard dBZ? 
                            // Let's use a stepped gradient to match "radar" feel better.
                        }} />

                        {/* Labels */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            marginLeft: '4px',
                            fontSize: '9px',
                            textAlign: 'left'
                        }}>
                            <span>Hail</span>
                            <span>100</span>
                            <span>50</span>
                            <span>25</span>
                            <span>10</span>
                            <span>5</span>
                            <span>1</span>
                            <span>0</span>
                        </div>
                    </div>
                    <div style={{ fontSize: '8px', marginTop: '2px', color: '#888' }}>dBZ</div>
                </div>
            )}
        </div>
    );
};
