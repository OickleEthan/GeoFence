import { TrackedObject, Zone } from '../api/types';
import { ChevronLeft, ChevronRight, Map, Plus, Trash2, Battery, Signal } from 'lucide-react';
import { AlertsPanel } from './AlertsPanel';
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

// Helper to calculate "time ago" string
const timeAgo = (dateStr: string): string => {
    const now = new Date();
    const then = new Date(dateStr);
    const diffMs = now.getTime() - then.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 5) return 'just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    return `${diffHr}h ago`;
};

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
                        <h2>Tracked Assets</h2>
                        <div className="object-list">
                            {objects.map(obj => (
                                <div
                                    key={obj.id}
                                    className={`object-item ${selectedObjectId === obj.id ? 'selected' : ''}`}
                                    onClick={() => onSelectObject(obj)}
                                >
                                    <div className="object-name">{obj.id}</div>
                                    <div className="object-meta">
                                        <span className="last-seen">{timeAgo(obj.last_seen)}</span>
                                        <div className="metrics-container" style={{ display: 'flex', gap: '8px' }}>
                                            {obj.battery_pct !== undefined && (
                                                <span
                                                    className="metric-badge"
                                                    title={`Battery: ${obj.battery_pct.toFixed(1)}%`}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontSize: '0.7rem',
                                                        color: obj.battery_pct < 20 ? '#f87171' : '#94a3b8'
                                                    }}
                                                >
                                                    <Battery size={12} />
                                                    {obj.battery_pct.toFixed(0)}%
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
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {objects.length === 0 && (
                                <div className="no-objects">No objects detected</div>
                            )}
                        </div>
                    </div>

                    {/* Zones Section */}
                    <div className="sidebar-section">
                        <div className="section-header">
                            <h2>Active Zones</h2>
                            <button className="add-zone-btn" onClick={onAddZone} title="Draw New Zone">
                                <Plus size={18} />
                            </button>
                        </div>
                        <div className="zone-list">
                            {zones.map(zone => (
                                <div
                                    key={zone.id}
                                    className={`zone-item ${selectedZoneId === zone.id ? 'selected' : ''}`}
                                    onClick={() => onSelectZone(zone)}
                                >
                                    <Map size={14} className="zone-icon" />
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
                    </div>

                    {/* Alerts Section */}
                    <div className="sidebar-section alerts-section">
                        <AlertsPanel />
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
