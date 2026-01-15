import React from 'react';
import { TrackedObject } from '../api/types';
import { Zap, Activity, Signal, Navigation } from 'lucide-react';
import './Overlay.css';

interface OverlayProps {
    selectedObject: TrackedObject | null;
    onCloseDetails: () => void;
    sidebarOpen: boolean;
    isFollowing: boolean;
    onToggleFollow: () => void;
}

export const Overlay: React.FC<OverlayProps> = ({
    selectedObject,
    onCloseDetails,
    sidebarOpen,
    isFollowing,
    onToggleFollow
}) => {
    return (
        <div className="overlay-container">
            {/* Header / Brand - Only show when sidebar is closed */}
            {!sidebarOpen && (
                <div className="glass-panel top-bar">
                    <h1>GEO-TRACKER</h1>
                    <div className="status-indicator">
                        <span className="dot pulse"></span>
                        LIVE
                    </div>
                </div>
            )}

            {/* Object Details Card */}
            {selectedObject && (
                <div className="glass-panel details-card">
                    <div className="card-header">
                        <h2>{selectedObject.id}</h2>
                        <div className="header-actions">
                            <button
                                onClick={onToggleFollow}
                                className={`follow-btn ${isFollowing ? 'active' : ''}`}
                                title={isFollowing ? "Stop Following" : "Follow Asset"}
                            >
                                <Navigation size={18} fill={isFollowing ? "currentColor" : "none"} />
                            </button>
                            <button onClick={onCloseDetails} className="close-btn">×</button>
                        </div>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-item">
                            <Activity size={16} />
                            <span className="label">Speed</span>
                            <span className="value">{selectedObject.speed_mps?.toFixed(1) || 0} <span className="unit">m/s</span></span>
                        </div>
                        <div className="stat-item">
                            <Zap size={16} />
                            <span className="label">Battery</span>
                            <span className="value">{selectedObject.battery_pct?.toFixed(0) || '--'} <span className="unit">%</span></span>
                        </div>
                        <div className="stat-item">
                            <Signal size={16} />
                            <span className="label">Confidence</span>
                            <span className="value">{(selectedObject.last_confidence * 100).toFixed(0)} <span className="unit">%</span></span>
                        </div>
                    </div>

                    <div className="last-seen">
                        Last Active: {new Date(selectedObject.last_seen).toLocaleTimeString()}
                    </div>
                </div>
            )}
        </div>
    );
};
