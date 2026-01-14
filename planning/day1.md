# Day 1 (Foundation + first end-to-end slice)

## Goal
Render live moving objects on a map using generator -> backend -> frontend.

## Backend
- [x] FastAPI project setup, health route
- [x] SQLite + models: TrackedObject, TelemetryPoint
- [x] POST /api/telemetry (accept batch)
- [x] GET /api/objects (latest)
- [x] GET /api/objects/{id}/telemetry (last N)

## Generator
- [x] Implement routes.json with 3 routes
- [x] Emit 1 Hz telemetry for 3 objects
- [x] Compute speed + heading from successive points
- [x] Post batches to backend

## Frontend
- [x] Vite React TS setup
- [x] MapLibre map renders
- [x] Fetch objects and render markers
- [x] Clicking marker shows sidebar details
- [x] Render basic trail (last N points)
- [x] Toggleable left sidebar with object list (object list with: name, last seen age, confidence badge)

## Deliverable by end of day
A working demo where objects move on the map and telemetry updates.
