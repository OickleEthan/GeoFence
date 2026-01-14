# Arctic Corridor Track and Geofence Alerts

## Overview
A real-time map-based tracking tool that ingests telemetry for multiple assets, renders their movement, and triggers alerts when assets cross user-defined zones.

## Background
I decided to choose this problem because during my interview with Ashley, we had a discussion about the mission in Feburary where snowmobiles are crossing the Arctic Corridor and Dominion Dynamics is tasked with tracking them. This problem resonated with me and I thought it would be a fun challenge to build a tool to help with this mission.

## Features
- Live object localization on a map
- Confidence value + additional telemetry fields (speed, heading, etc.)
- User drawn zones (polygon and/or bbox)
- Alerts for zone entry and exit (plus optional rules)
- Telemetry generator included for reproducible demo

## Tech Stack
- Backend: FastAPI, SQLite (SQLAlchemy/SQLModel), WebSocket (optional)
- Frontend: React + Vite + TypeScript, MapLibre GL
- Tooling: Docker Compose optional, Makefile or scripts for one-command run

## Architecture
### High-level components
- Telemetry generator (simulated)
- Backend ingest + storage + alert evaluation
- Frontend map UI + zone editor + alert log

### Data flow
1. Generator emits telemetry points
2. Backend validates and stores points
3. Backend updates object state and evaluates zone rules
4. Frontend subscribes (WebSocket) or polls
5. UI renders objects, trails, zones, alerts

### Data model
Brief description of: TrackedObject, TelemetryPoint, Zone, AlertRule, AlertEvent, ObjectZoneState

## API
List endpoints with short examples:
- POST /api/telemetry
- GET /api/objects
- GET /api/objects/{id}/telemetry
- GET/POST/PUT/DELETE /api/zones
- GET /api/alerts

## Alert Logic
- Enter and exit detection uses ObjectZoneState
- Cooldown and dedupe strategy (prevent alert spam)
- Boundary rules (edge counts as inside or define explicitly)

## Failure Modes and Mitigations
- GPS jitter near boundaries
- Out-of-order packets
- Stale/heartbeat
- Alert fatigue
- Performance (downsampling trail, fixed UI refresh cadence)

## How to Run

### Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the FastAPI server:
   ```bash
   python -m uvicorn src.app.main:app --reload
   ```
   The backend will be available at `http://localhost:8000`. Database (`database.db`) will be created automatically on startup.

### Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.

### Telemetry Generator
From the project root, run the simulation script to generate live movements:
```bash
python tools/telemetry_generator/generator.py
```
This script simulates drone and vehicle movements across the Canadian Arctic and sends telemetry data to the backend API.

## Testing
- Unit tests for: point-in-polygon, state transitions, dedupe
- Contract tests for API schemas (optional)

## Tradeoffs and Future Work
- Geo indexing (PostGIS) if scaling
- Better smoothing / Kalman filter
- Role-based auth and multi-tenant isolation
- Additional map layers (weather, terrain, etc.)
