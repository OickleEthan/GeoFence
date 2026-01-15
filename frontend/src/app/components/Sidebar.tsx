import React, { useState } from 'react';
import { TrackedObject, Zone } from '../api/types.ts';
import { ChevronLeft, ChevronRight, Map, Plus, Trash2, Battery, Signal, Plane, Car, LayoutGrid, AlertTriangle, ChevronDown } from 'lucide-react';
import { isAssetStale, timeAgo } from '../utils.ts';
import { AlertsPanel } from './AlertsPanel.tsx';
import './Sidebar.css';

interface SidebarProps {
    objects: TrackedObject[];
    zones: Zone[];
    isOpen: boolean;
    onToggle: () => void;
    onSelectObject: (obj: TrackedObject) => void;
    onSelectZone: (zone: Zone) => void;
    onAddZone: () => void;
    onRemoveZone: (zoneId: number) => void;
    selectedObjectId: string | null;
    selectedZoneId: number | null;
}

// Helper to get confidence badge color
const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return '#4ade80'; // Green
    if (confidence >= 0.7) return '#fbbf24'; // Amber
    return '#f87171'; // Red
};

export const Sidebar: React.FC<SidebarProps> = ({
    objects,
    zones,
    isOpen,
    onToggle,
    onSelectObject,
    onSelectZone,
    onAddZone,
    onRemoveZone,
    selectedObjectId,
    selectedZoneId
}) => {
    const [assetFilter, setAssetFilter] = useState('all');
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
        assets: false,
        zones: false,
        alerts: false
    });

    const toggleSection = (section: string) => {
        setCollapsedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleDeleteZone = (e: React.MouseEvent, zone: Zone) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete zone "${zone.name}"?`)) {
            if (zone.id) onRemoveZone(zone.id);
        }
    };
    return (
        <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
            {isOpen && (
                <div className="sidebar-content">
                    {/* ... (sidebar header) */}
                    <div className="sidebar-header">
                        <button className="sidebar-toggle-integrated" onClick={onToggle}>
                            <ChevronLeft size={20} />
                        </button>
                        <h1>GEO-TRACKER</h1>
                        <div className="status-indicator">
                            <span className="dot pulse"></span>
                            LIVE
                        </div>
                    </div>

                    {/* Objects Section */}
                    <div className="sidebar-section">
                        <div className="section-header" onClick={() => toggleSection('assets')} style={{ cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {collapsedSections['assets'] ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                                <h2>Tracked Assets</h2>
                            </div>
                            <div className="filter-buttons" onClick={(e) => e.stopPropagation()}>
                                <button
                                    className={`filter-btn ${assetFilter === 'all' ? 'active' : ''}`}
                                    onClick={() => setAssetFilter('all')}
                                >
                                    <LayoutGrid size={16} />
                                    <span className="tooltip">Show All</span>
                                </button>
                                <button
                                    className={`filter-btn ${assetFilter === 'drone' ? 'active' : ''}`}
                                    onClick={() => setAssetFilter('drone')}
                                >
                                    <Plane size={16} />
                                    <span className="tooltip">Show Drones</span>
                                </button>
                                <button
                                    className={`filter-btn ${assetFilter === 'vehicle' ? 'active' : ''}`}
                                    onClick={() => setAssetFilter('vehicle')}
                                >
                                    <Car size={16} />
                                    <span className="tooltip">Show Vehicles</span>
                                </button>
                            </div>
                        </div>
                        {!collapsedSections['assets'] && (
                            <div className="object-list">
                                {objects.filter(obj => {
                                    if (assetFilter === 'all') return true;
                                    if (assetFilter === 'drone') return obj.id.toLowerCase().includes('drone');
                                    if (assetFilter === 'vehicle') return obj.id.toLowerCase().includes('vehicle');
                                    return true;
                                }).map(obj => {
                                    const stale = isAssetStale(obj);
                                    return (
                                        <div
                                            key={obj.id}
                                            className={`object-item ${selectedObjectId === obj.id ? 'selected' : ''} ${stale ? 'stale-item' : ''}`}
                                            onClick={() => onSelectObject(obj)}
                                        >
                                            <div className="object-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {stale ? (
                                                    <AlertTriangle size={18} color="#f87171" className="blink" />
                                                ) : (
                                                    <div className="object-icon">
                                                        {obj.id.toLowerCase().includes('drone') ? <Plane size={16} /> : <Car size={16} />}
                                                    </div>
                                                )}
                                                <div className="object-name">{obj.id}</div>
                                            </div>

                                            <div className="object-meta">
                                                <span className="last-seen">{timeAgo(obj.last_seen)}</span>
                                                <div className="metrics-container" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    {stale ? (
                                                        <span className="connection-badge" style={{
                                                            backgroundColor: '#ef4444',
                                                            color: 'white',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            fontSize: '0.65rem',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            No Connection
                                                        </span>
                                                    ) : (
                                                        <>
                                                            {obj.battery_pct !== undefined && (
                                                                <span
                                                                    className="metric-badge"
                                                                    title={`Battery: ${obj.battery_pct?.toFixed(1)}%`}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px',
                                                                        fontSize: '0.7rem',
                                                                        color: (obj.battery_pct || 0) < 20 ? '#f87171' : '#94a3b8'
                                                                    }}
                                                                >
                                                                    <Battery size={12} />
                                                                    {obj.battery_pct?.toFixed(0)}%
                                                                </span>
                                                            )}
                                                            <span
                                                                className="confidence-badge"
                                                                title="Confidence"
                                                                style={{
                                                                    backgroundColor: getConfidenceColor(obj.last_confidence),
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px'
                                                                }}
                                                            >
                                                                <Signal size={10} />
                                                                {(obj.last_confidence * 100).toFixed(0)}%
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {objects.length === 0 && (
                                    <div className="no-objects">No objects detected</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Zones Section */}
                    <div className="sidebar-section">
                        <div className="section-header" onClick={() => toggleSection('zones')} style={{ cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {collapsedSections['zones'] ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                                <h2>Active Zones</h2>
                            </div>
                            <button className="add-zone-btn" onClick={(e) => { e.stopPropagation(); onAddZone(); }} title="Draw New Zone">
                                <Plus size={18} />
                            </button>
                        </div>
                        {!collapsedSections['zones'] && (
                            <div className="zone-list">
                                {zones.map(zone => (
                                    <div
                                        key={zone.id}
                                        className={`zone-item ${selectedZoneId === zone.id ? 'selected' : ''}`}
                                        onClick={() => onSelectZone(zone)}
                                    >
                                        <Map size={14} className="zone-icon" color={zone.color || '#06b6d4'} />
                                        <span className="zone-name">{zone.name}</span>
                                        {zone.is_polygon && <span className="zone-tag">Poly</span>}
                                        {!zone.is_polygon && <span className="zone-tag">BBox</span>}
                                        <button
                                            className="delete-zone-btn"
                                            onClick={(e) => handleDeleteZone(e, zone)}
                                            title="Delete Zone"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                                {zones.length === 0 && (
                                    <div className="no-zones">No zones created</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Alerts Section */}
                    <div className="sidebar-section alerts-section">
                        <div className="section-header" onClick={() => toggleSection('alerts')} style={{ cursor: 'pointer', marginBottom: collapsedSections['alerts'] ? '0' : '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {collapsedSections['alerts'] ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                                <h2>System Alerts</h2>
                            </div>
                        </div>
                        {!collapsedSections['alerts'] && <AlertsPanel />}
                    </div>
                </div>
            )}

            {/* Floating toggle button when closed */}
            {!isOpen && (
                <button className="sidebar-toggle-floating" onClick={onToggle}>
                    <ChevronRight size={20} />
                </button>
            )}
        </div>
    );
};
