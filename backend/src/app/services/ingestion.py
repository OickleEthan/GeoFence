from datetime import datetime
from typing import List, Optional
from sqlmodel import Session, select
from src.app.db.models import TelemetryPoint, TrackedObject, Zone, TelemetryRecord
from src.app.services.zone_eval import is_point_in_zone

# Simple in-memory alert log for MVP
ALERT_LOG = []

def process_telemetry(point: TelemetryPoint, session: Session):
    """
    Ingest a telemetry point:
    1. Update/Create TrackedObject in DB
    2. Check Zone Rules
    3. (Optional) Log Alerts
    """
    
    # 1. Update Object State
    statement = select(TrackedObject).where(TrackedObject.id == point.object_id)
    obj = session.exec(statement).first()
    
    if not obj:
        obj = TrackedObject(
            id=point.object_id,
            last_seen=point.ts,
            last_lat=point.position.lat,
            last_lon=point.position.lon,
            last_confidence=point.confidence
        )
    else:
        # Update latest state
        # Ensure obj.last_seen is timezone-aware for comparison
        last_seen_aware = obj.last_seen
        if last_seen_aware.tzinfo is None:
            last_seen_aware = last_seen_aware.replace(tzinfo=point.ts.tzinfo)

        if point.ts >= last_seen_aware: # Only update if newer
            obj.last_seen = point.ts
            obj.last_lat = point.position.lat
            obj.last_lon = point.position.lon
            obj.last_confidence = point.confidence
            
    # Update detailed fields
    obj.speed_mps = point.telemetry.speed_mps
    obj.heading_deg = point.telemetry.heading_deg
    obj.battery_pct = point.telemetry.battery_pct
    
    session.add(obj)

    # 1b. Insert History Record
    record = TelemetryRecord(
        object_id=point.object_id,
        ts=point.ts,
        lat=point.position.lat,
        lon=point.position.lon,
        alt_m=point.position.alt_m,
        speed_mps=point.telemetry.speed_mps,
        heading_deg=point.telemetry.heading_deg,
        battery_pct=point.telemetry.battery_pct
    )
    session.add(record)
    
    # 2. Check Zones (Naive check against ALL enabled zones for MVP)
    # In production, use PostGIS or R-Tree to filter candidate zones.
    zones = session.exec(select(Zone).where(Zone.enabled == True)).all()
    
    for zone in zones:
        if is_point_in_zone(point, zone):
            # Check if this is a NEW entry or just continuing inside
            # For MVP, just log "Inside"
            log_alert(f"Object {point.object_id} is inside zone {zone.name}", "ZONE_ACTIVE")
            
    session.commit()
    session.refresh(obj)
    return obj

def log_alert(message: str, alert_type: str):
    print(f"[{datetime.now()}] ALERTE: {message}")
    ALERT_LOG.append({
        "ts": datetime.now(),
        "message": message,
        "type": alert_type
    })
