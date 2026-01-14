from datetime import datetime, timezone
from typing import List, Optional
from sqlmodel import Session, select
from src.app.db.models import TelemetryPoint, TrackedObject, Zone, TelemetryRecord, ObjectZoneState, AlertEvent, AlertType
from src.app.services.zone_eval import is_point_in_zone

# Thresholds
CONFIDENCE_THRESHOLD = 0.5

def process_telemetry(point: TelemetryPoint, session: Session):
    """
    Ingest a telemetry point:
    1. Update/Create TrackedObject in DB
    2. Check Zone Rules and detect Transitions
    3. Log Alerts to DB
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
        last_seen_aware = obj.last_seen
        if last_seen_aware.tzinfo is None:
            last_seen_aware = last_seen_aware.replace(tzinfo=timezone.utc)

        if point.ts >= last_seen_aware:
            obj.last_seen = point.ts
            obj.last_lat = point.position.lat
            obj.last_lon = point.position.lon
            obj.last_confidence = point.confidence
            
    obj.speed_mps = point.telemetry.speed_mps
    obj.heading_deg = point.telemetry.heading_deg
    obj.battery_pct = point.telemetry.battery_pct
    
    session.add(obj)

    # history record
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
    
    # 2. Check Zones
    zones = session.exec(select(Zone).where(Zone.enabled == True)).all()
    
    for zone in zones:
        is_now_inside = is_point_in_zone(point, zone)
        
        # Get existing state
        state_stmt = select(ObjectZoneState).where(
            ObjectZoneState.object_id == point.object_id,
            ObjectZoneState.zone_id == zone.id
        )
        state = session.exec(state_stmt).first()
        
        if not state:
            state = ObjectZoneState(
                object_id=point.object_id,
                zone_id=zone.id,
                is_inside=is_now_inside,
                last_updated=point.ts
            )
            session.add(state)
            # If it's the first time and it's inside, trigger an ENTER alert
            if is_now_inside:
                trigger_alert(session, point.object_id, zone.id, AlertType.ENTER, f"Object {point.object_id} entered zone {zone.name}")
        else:
            # Transitions
            if is_now_inside and not state.is_inside:
                trigger_alert(session, point.object_id, zone.id, AlertType.ENTER, f"Object {point.object_id} entered zone {zone.name}")
            elif not is_now_inside and state.is_inside:
                trigger_alert(session, point.object_id, zone.id, AlertType.EXIT, f"Object {point.object_id} exited zone {zone.name}")
            
            # Low Confidence Alert (while inside)
            if is_now_inside and point.confidence < CONFIDENCE_THRESHOLD:
                # To prevent alert spam, we could check last alert TS, 
                # but for MVP we'll just trigger if it's a significant drop or always
                # Let's check if the previous point was high confidence to avoid spamming every second
                trigger_alert(session, point.object_id, zone.id, AlertType.LOW_CONFIDENCE, 
                              f"Object {point.object_id} confidence dropped to {point.confidence:.2f} inside {zone.name}")

            state.is_inside = is_now_inside
            state.last_updated = point.ts
            session.add(state)
            
    session.commit()
    session.refresh(obj)
    return obj

def trigger_alert(session: Session, object_id: str, zone_id: int, alert_type: AlertType, message: str):
    """
    Create an AlertEvent in the database.
    """
    # Optional: Deduplication logic here
    alert = AlertEvent(
        object_id=object_id,
        zone_id=zone_id,
        alert_type=alert_type,
        message=message,
        ts=datetime.now(timezone.utc)
    )
    session.add(alert)
    print(f"[{alert.ts}] ALERT: {message} ({alert_type})")
