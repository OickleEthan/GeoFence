import { TrackedObject, Zone, TelemetryRecord } from './types';

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

    getHistory: async (objectId: string, limit: number = 50): Promise<TelemetryRecord[]> => {
        const res = await fetch(`${API_BASE}/objects/${objectId}/history?limit=${limit}`);
        if (!res.ok) throw new Error('Failed to fetch history');
        return res.json();
    }
};
