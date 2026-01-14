// Domain Types matching Backend

export interface Position {
    lat: number;
    lon: number;
    alt_m?: number;
}

export interface TelemetryData {
    speed_mps: number;
    heading_deg: number;
    rssi_dbm?: number;
    battery_pct?: number;
    source?: string;
}

export interface TelemetryPoint {
    object_id: string;
    ts: string; // ISO String
    position: Position;
    confidence: number;
    telemetry: TelemetryData;
}

export interface TrackedObject {
    id: string;
    last_seen: string;
    last_lat: number;
    last_lon: number;
    last_confidence: number;
    speed_mps?: number;
    heading_deg?: number;
    battery_pct?: number;
}

export enum AlertType {
    ENTER = "ENTER",
    EXIT = "EXIT",
    LOW_CONFIDENCE = "LOW_CONFIDENCE",
    STALE = "STALE"
}

export interface Zone {
    id?: number;
    name: string;
    min_lat?: number;
    min_lon?: number;
    max_lat?: number;
    max_lon?: number;
    is_polygon: boolean;
    polygon_coords?: string; // JSON string
    enabled: boolean;
}

export interface AlertEvent {
    id: number;
    ts: string;
    object_id: string;
    zone_id?: number;
    alert_type: AlertType;
    message: string;
    ack: boolean;
}

export interface TelemetryRecord {
    id: number;
    object_id: string;
    ts: string;
    lat: number;
    lon: number;
    alt_m?: number;
    speed_mps?: number;
    heading_deg?: number;
    battery_pct?: number;
}
