# Day 2 (Zones + Alerts)

## Goal
User creates zone and system triggers enter/exit alerts reliably.

## Backend
- [x] Models: Zone, ObjectZoneState, AlertEvent
- [x] CRUD minimal: POST /api/zones, GET /api/zones, DELETE /api/zones
- [x] Zone evaluation on new telemetry point
- [x] Enter/exit detection using ObjectZoneState
- [x] Create AlertEvent with cooldown/dedupe

## Frontend
- [x] Draw bbox tool (minimum)
- [x] Persist zones to backend
- [x] Render zones on map
- [x] Alerts panel: poll GET /api/alerts and render list

## Generator
- [x] Ensure routes cross the bbox zone
- [x] Add confidence field variation

## Deliverable by end of day
Draw a zone, see enter/exit alerts as assets move.
