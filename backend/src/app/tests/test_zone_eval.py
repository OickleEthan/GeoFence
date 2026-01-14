import pytest
from datetime import datetime, timezone
from src.app.db.models import TelemetryPoint, Zone, Position, TelemetryData

# Helper to create a point
def create_point(lat, lon):
    return TelemetryPoint(
        object_id="test_obj",
        ts=datetime.now(timezone.utc),
        position=Position(lat=lat, lon=lon),
        confidence=1.0,
        telemetry=TelemetryData(speed_mps=10, heading_deg=0)
    )

@pytest.fixture
def test_zone():
    return Zone(
        name="Test Zone",
        min_lat=10.0,
        min_lon=10.0,
        max_lat=20.0,
        max_lon=20.0
    )

def test_point_inside(test_zone):
    from src.app.services.zone_eval import is_point_in_zone
    p = create_point(15.0, 15.0)
    assert is_point_in_zone(p, test_zone) is True

def test_point_outside_lat(test_zone):
    from src.app.services.zone_eval import is_point_in_zone
    p_north = create_point(21.0, 15.0)
    p_south = create_point(9.0, 15.0)
    assert is_point_in_zone(p_north, test_zone) is False
    assert is_point_in_zone(p_south, test_zone) is False

def test_point_outside_lon(test_zone):
    from src.app.services.zone_eval import is_point_in_zone
    p_east = create_point(15.0, 21.0)
    p_west = create_point(15.0, 9.0)
    assert is_point_in_zone(p_east, test_zone) is False
    assert is_point_in_zone(p_west, test_zone) is False

def test_point_on_edge(test_zone):
    from src.app.services.zone_eval import is_point_in_zone
    # Exact edges should be INCLUSIVE
    p_min_lat = create_point(10.0, 15.0)
    p_max_lat = create_point(20.0, 15.0)
    p_min_lon = create_point(15.0, 10.0)
    p_max_lon = create_point(15.0, 20.0)
    
    assert is_point_in_zone(p_min_lat, test_zone) is True
    assert is_point_in_zone(p_max_lat, test_zone) is True
    assert is_point_in_zone(p_min_lon, test_zone) is True
    assert is_point_in_zone(p_max_lon, test_zone) is True

def test_point_on_corner(test_zone):
    from src.app.services.zone_eval import is_point_in_zone
    p_corner = create_point(10.0, 10.0)
    assert is_point_in_zone(p_corner, test_zone) is True
