import time
import math
import random
import requests
from datetime import datetime, timezone

API_URL = "http://localhost:8000/api/telemetry/"

class SimulatedObject:
    def __init__(self, obj_id, start_lat, start_lon, movement_type="static"):
        self.obj_id = obj_id
        self.lat = start_lat
        self.lon = start_lon
        self.movement_type = movement_type
        self.battery = 100.0
        self.tick = 0
        
        # Movement params
        self.center_lat = start_lat
        self.center_lon = start_lon
        self.radius = 0.005  # approx 500m
        
    def update(self):
        self.tick += 1
        
        # Update Position
        if self.movement_type == "circle":
            angle = (self.tick * 5) % 360
            rad = math.radians(angle)
            self.lat = self.center_lat + (self.radius * math.sin(rad))
            self.lon = self.center_lon + (self.radius * math.cos(rad))
            self.heading = (angle + 90) % 360
            self.speed = 15.0
        elif self.movement_type == "linear":
            # Move diagonal up-right
            self.lat += 0.0001
            self.lon += 0.0001
            self.heading = 45.0
            self.speed = 22.5
        else:
            self.heading = 0
            self.speed = 0

        # Decay Battery
        self.battery = max(0, self.battery - 0.05)
        
        # Random RSSI
        self.rssi = random.uniform(-60, -85)

    def get_payload(self):
        return {
            "object_id": self.obj_id,
            "ts": datetime.now(timezone.utc).isoformat(),
            "position": {
                "lat": self.lat,
                "lon": self.lon,
                "alt_m": 120.5
            },
            "confidence": 0.99,
            "telemetry": {
                "speed_mps": self.speed,
                "heading_deg": self.heading,
                "rssi_dbm": self.rssi,
                "battery_pct": self.battery,
                "source": "sim_gen"
            }
        }

def run_simulation():
    objects = [
      # Iqaluit, Nunavut Coordinates
    # Lat: ~63.7467, Lon: ~-68.5170
    SimulatedObject("drone_alpha", 63.7467, -68.5170, "circle"),
    SimulatedObject("vehicle_bravo", 63.7450, -68.5150, "linear")
    ]
    
    print(f"Starting simulation for {len(objects)} objects...")
    
    while True:
        for obj in objects:
            obj.update()
            payload = obj.get_payload()
            try:
                r = requests.post(API_URL, json=payload, timeout=1)
                print(f"[{r.status_code}] Sent {obj.obj_id}: batt={obj.battery:.1f}%")
            except Exception as e:
                print(f"Error sending {obj.obj_id}: {e}")
        
        time.sleep(1.0)

if __name__ == "__main__":
    run_simulation()
