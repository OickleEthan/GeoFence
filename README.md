# Arctic Corridor Track and Geofence Alerts

## Overview
A real-time map-based tracking tool that ingests telemetry for multiple assets, renders their movement, and triggers alerts when assets cross user-defined zones.

## Features (what works)
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
Commands…

### Frontend
Commands…

### Telemetry Generator
Commands…

## Testing
- Unit tests for: point-in-polygon, state transitions, dedupe
- Contract tests for API schemas (optional)

## Tradeoffs and Future Work
- Geo indexing (PostGIS) if scaling
- Better smoothing / Kalman filter
- Role-based auth and multi-tenant isolation
- Additional map layers (weather, terrain, etc.)
