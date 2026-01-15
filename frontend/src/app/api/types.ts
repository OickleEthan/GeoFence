export type AlertType = 'ENTER' | 'EXIT' | 'LOW_CONFIDENCE' | 'STALE';

export interface TrackedObject {
    id: string;
    last_seen: string;
    last_lat: number;
    last_lon: number;
    last_confidence: number;
    speed_mps?: number | null;
    heading_deg?: number | null;
    battery_pct?: number | null;
}

export interface TelemetryRecord {
    id?: number | null;
    object_id: string;
    ts: string;
    lat: number;
    lon: number;
    alt_m?: number | null;
    speed_mps?: number | null;
    heading_deg?: number | null;
    battery_pct?: number | null;
}

export interface Zone {
    id?: number | null;
    name: string;
    min_lat?: number | null;
    min_lon?: number | null;
    max_lat?: number | null;
    max_lon?: number | null;
    is_polygon: boolean;
    polygon_coords?: string | null;
    enabled: boolean;
    color: string;
    created_at?: string | null;
}

export interface AlertEvent {
    id?: number | null;
    ts: string;
    object_id: string;
    zone_id?: number | null;
    alert_type: AlertType;
    message: string;
    ack: boolean;
}
