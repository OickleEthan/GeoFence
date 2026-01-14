from src.app.db.models import TelemetryPoint, Zone

def is_point_in_zone(point: TelemetryPoint, zone: Zone) -> bool:
    """
    Check if a telemetry point falls within a zone's bounding box.
    Boundary conditions are INCLUSIVE.
    """
    lat = point.position.lat
    lon = point.position.lon
    
    return (
        zone.min_lat <= lat <= zone.max_lat and
        zone.min_lon <= lon <= zone.max_lon
    )
