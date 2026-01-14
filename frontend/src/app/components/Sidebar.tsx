import React from 'react';
import { TrackedObject } from '../api/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
    objects: TrackedObject[];
    isOpen: boolean;
    onToggle: () => void;
    onSelectObject: (obj: TrackedObject) => void;
    selectedObjectId: string | null;
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
    isOpen,
    onToggle,
    onSelectObject,
    selectedObjectId
}) => {
    return (
        <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
            {isOpen && (
                <div className="sidebar-content">
                    {/* Title Header with integrated toggle */}
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
                    <h2>Tracked Objects</h2>
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
                                    <span
                                        className="confidence-badge"
                                        style={{ backgroundColor: getConfidenceColor(obj.last_confidence) }}
                                    >
                                        {(obj.last_confidence * 100).toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                        {objects.length === 0 && (
                            <div className="no-objects">No objects detected</div>
                        )}
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
