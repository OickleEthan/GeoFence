# MVP Checklist (must ship)

## Core requirements (Problem 1)
- [x] Object movement localized on a map
- [x] Confidence displayed for each object
- [x] At least two other telemetry values displayed (speed + heading recommended)
- [x] User can create an area of interest
  - [x] BBOX (minimum)
  - [x] Polygon (stretch)
- [x] Alert triggers on object movement relative to zone
  - [x] Enter
  - [x] Exit

## MVP UX
- [x] Map renders markers for objects
- [x] Clicking an object shows a details panel
- [x] Alert log visible and updates as alerts occur

## Backend MVP
- [x] POST /api/telemetry accepts telemetry point(s)
- [x] GET /api/objects returns latest states
- [x] GET /api/objects/{id}/telemetry returns last N points
- [x] POST /api/zones stores bbox zone
- [x] GET /api/alerts returns latest alerts
- [x] Basic dedupe or cooldown to prevent alert spam

## Telemetry generator MVP
- [x] Generates at least 2 moving objects with believable routes
- [x] Emits 1 Hz updates
- [x] Posts to backend successfully

## If time is short, cut in this order
1. WebSocket streaming (use polling)
2. Polygon drawing (bbox only)
3. Low confidence and stale rules (enter/exit only)
4. Multi-object filters and UI polish
