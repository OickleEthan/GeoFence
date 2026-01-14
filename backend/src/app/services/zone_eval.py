import json
from shapely.geometry import Point, Polygon
from src.app.db.models import TelemetryPoint, Zone

def is_point_in_zone(point: TelemetryPoint, zone: Zone) -> bool:
    """
    Check if a telemetry point falls within a zone (BBOX or Polygon).
    """
    lat = point.position.lat
    lon = point.position.lon
    
    if zone.is_polygon and zone.polygon_coords:
        try:
            # Parse polygon coordinates
            # Expected format: [[lat, lon], [lat, lon], ...]
            coords = json.loads(zone.polygon_coords)
            # Shapely expects (x, y) which is usually (lon, lat)
            poly = Polygon([(c[1], c[0]) for c in coords])
            pt = Point(lon, lat)
            return poly.contains(pt)
        except Exception as e:
            print(f"Error evaluating polygon for zone {zone.id}: {e}")
            return False
            
    # Default to BBOX check if not a polygon or missing polygon data
    # Ensure values are not None (fallback to False if missing)
    if zone.min_lat is None or zone.min_lon is None or \
       zone.max_lat is None or zone.max_lon is None:
        return False
        
    return (
        zone.min_lat <= lat <= zone.max_lat and
        zone.min_lon <= lon <= zone.max_lon
    )
