import httpx
import time
from datetime import datetime, timezone

BASE_URL = "http://localhost:8000"

def test_backend_flow():
    # 1. Wait for health
    print("Waiting for backend...")
    for _ in range(10):
        try:
            r = httpx.get(f"{BASE_URL}/health")
            if r.status_code == 200:
                print("Backend is UP")
                break
        except:
            time.sleep(1)
    else:
        print("Backend failed to start")
        exit(1)

    # 2. Create Zone
    zone_data = {
        "name": "Test Zone Alpha",
        "min_lat": 63.7460,
        "min_lon": -68.5180,
        "max_lat": 63.7480,
        "max_lon": -68.5160,
        "enabled": True
    }
    print("Creating Zone...")
    r = httpx.post(f"{BASE_URL}/api/zones/", json=zone_data)
    print(f"Zone Create Status: {r.status_code}")
    assert r.status_code == 201
    
    # 3. Ingest Telemetry (Inside)
    telemetry_pt = {
        "object_id": "manual_test_obj",
        "ts": datetime.now(timezone.utc).isoformat(),
        "position": {"lat": 63.7470, "lon": -68.5170, "alt_m": 100},
        "confidence": 0.99,
        "telemetry": {
            "speed_mps": 15.5,
            "heading_deg": 45.0,
            "battery_pct": 88.5
        }
    }
    print("Sending Telemetry (Inside)...")
    r = httpx.post(f"{BASE_URL}/api/telemetry/", json=telemetry_pt)
    print(f"Telemetry Status: {r.status_code}")
    print(f"Response: {r.json()}")
    assert r.status_code == 201

if __name__ == "__main__":
    test_backend_flow()
