import { TrackedObject, Zone, TelemetryRecord, AlertEvent } from './types';

const API_BASE = '/api'; // Vite proxy will handle this

export const api = {
    getObjects: async (): Promise<TrackedObject[]> => {
        const res = await fetch(`${API_BASE}/objects/`);
        if (!res.ok) throw new Error('Failed to fetch objects');
        return res.json();
    },

    getZones: async (): Promise<Zone[]> => {
        const res = await fetch(`${API_BASE}/zones/`);
        if (!res.ok) throw new Error('Failed to fetch zones');
        return res.json();
    },

    createZone: async (zone: Zone): Promise<Zone> => {
        const res = await fetch(`${API_BASE}/zones/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(zone)
        });
        if (!res.ok) throw new Error('Failed to create zone');
        return res.json();
    },

    deleteZone: async (zoneId: number): Promise<void> => {
        const res = await fetch(`${API_BASE}/zones/${zoneId}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to delete zone');
    },

    getAlerts: async (limit: number = 50): Promise<AlertEvent[]> => {
        const res = await fetch(`${API_BASE}/alerts/?limit=${limit}`);
        if (!res.ok) throw new Error('Failed to fetch alerts');
        return res.json();
    },

    ackAlert: async (alertId: number): Promise<void> => {
        const res = await fetch(`${API_BASE}/alerts/${alertId}/ack`, {
            method: 'POST'
        });
        if (!res.ok) throw new Error('Failed to acknowledge alert');
    },

    getHistory: async (objectId: string, limit: number = 50): Promise<TelemetryRecord[]> => {
        const res = await fetch(`${API_BASE}/objects/${objectId}/history?limit=${limit}`);
        if (!res.ok) throw new Error('Failed to fetch history');
        return res.json();
    }
};
