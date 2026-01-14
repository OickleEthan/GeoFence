# Day 2 (Zones + Alerts)

## Goal
User creates zone and system triggers enter/exit alerts reliably.

## Backend
- [ ] Models: Zone, ObjectZoneState, AlertEvent
- [ ] CRUD minimal: POST /api/zones, GET /api/zones, DELETE /api/zones
- [ ] Zone evaluation on new telemetry point
- [ ] Enter/exit detection using ObjectZoneState
- [ ] Create AlertEvent with cooldown/dedupe

## Frontend
- [ ] Draw bbox tool (minimum)
- [ ] Persist zones to backend
- [ ] Render zones on map
- [ ] Alerts panel: poll GET /api/alerts and render list

## Generator
- [ ] Ensure routes cross the bbox zone
- [ ] Add confidence field variation

## Deliverable by end of day
Draw a zone, see enter/exit alerts as assets move.
