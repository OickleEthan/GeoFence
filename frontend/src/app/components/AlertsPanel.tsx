import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { AlertEvent, AlertType } from '../api/types';
import { Bell, CheckCircle, AlertTriangle, Info, MapPin, LogIn, LogOut, List } from 'lucide-react';
import './AlertsPanel.css';

export const AlertsPanel: React.FC = () => {
    const [alerts, setAlerts] = useState<AlertEvent[]>([]);
    const [alertFilter, setAlertFilter] = useState('all');

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const data = await api.getAlerts(20);
                setAlerts(data);
            } catch (err) {
                console.error("Failed to fetch alerts", err);
            }
        };

        fetchAlerts();
        const interval = setInterval(fetchAlerts, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleAck = async (id: number) => {
        try {
            await api.ackAlert(id);
            setAlerts(prev => prev.map(a => a.id === id ? { ...a, ack: true } : a));
        } catch (err) {
            console.error("Failed to ack alert", err);
        }
    };

    const getIcon = (type: AlertType) => {
        switch (type) {
            case AlertType.ENTER: return <MapPin className="alert-icon enter" size={16} />;
            case AlertType.EXIT: return <MapPin className="alert-icon exit" size={16} />;
            case AlertType.LOW_CONFIDENCE: return <AlertTriangle className="alert-icon warning" size={16} />;
            case AlertType.STALE: return <Bell className="alert-icon error" size={16} />;
            default: return <Info className="alert-icon info" size={16} />;
        }
    };

    return (
        <div className="alerts-panel">
            <div className="alerts-header">
                <h3>Live Alerts</h3>
                <div className="filter-buttons">
                    <button
                        className={`filter-btn ${alertFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setAlertFilter('all')}
                    >
                        <List size={16} />
                        <span className="tooltip">Show All</span>
                    </button>
                    <button
                        className={`filter-btn ${alertFilter === 'enter' ? 'active' : ''}`}
                        onClick={() => setAlertFilter('enter')}
                    >
                        <LogIn size={16} />
                        <span className="tooltip">Show Enter</span>
                    </button>
                    <button
                        className={`filter-btn ${alertFilter === 'exit' ? 'active' : ''}`}
                        onClick={() => setAlertFilter('exit')}
                    >
                        <LogOut size={16} />
                        <span className="tooltip">Show Exit</span>
                    </button>
                    <button
                        className={`filter-btn ${alertFilter === 'low_confidence' ? 'active' : ''}`}
                        onClick={() => setAlertFilter('low_confidence')}
                    >
                        <AlertTriangle size={16} />
                        <span className="tooltip">Show Low Confidence</span>
                    </button>
                </div>
            </div>
            <div className="alerts-list">
                {alerts.length === 0 && <div className="no-alerts">No alerts yet</div>}
                {alerts.filter(alert => {
                    if (alertFilter === 'all') return true;
                    if (alertFilter === 'enter') return alert.alert_type === 'ENTER';
                    if (alertFilter === 'exit') return alert.alert_type === 'EXIT';
                    if (alertFilter === 'low_confidence') return alert.alert_type === 'LOW_CONFIDENCE';
                    return true;
                }).map(alert => (
                    <div key={alert.id} className={`alert-item ${alert.alert_type.toLowerCase()} ${alert.ack ? 'acked' : ''}`}>
                        <div className="alert-top">
                            {getIcon(alert.alert_type)}
                            <span className="alert-type">{alert.alert_type}</span>
                            <span className="alert-time">{new Date(alert.ts).toLocaleTimeString()}</span>
                        </div>
                        <div className="alert-message">{alert.message}</div>
                        {!alert.ack && (
                            <button className="ack-btn" onClick={() => handleAck(alert.id)}>
                                <CheckCircle size={14} /> Ack
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
