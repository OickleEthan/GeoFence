# MVP Checklist (must ship)

## Core requirements (Problem 1)
- [ ] Object movement localized on a map
- [ ] Confidence displayed for each object
- [ ] At least two other telemetry values displayed (speed + heading recommended)
- [ ] User can create an area of interest
  - [ ] BBOX (minimum)
  - [ ] Polygon (stretch)
- [ ] Alert triggers on object movement relative to zone
  - [ ] Enter
  - [ ] Exit

## MVP UX
- [ ] Map renders markers for objects
- [ ] Clicking an object shows a details panel
- [ ] Alert log visible and updates as alerts occur

## Backend MVP
- [ ] POST /api/telemetry accepts telemetry point(s)
- [ ] GET /api/objects returns latest states
- [ ] GET /api/objects/{id}/telemetry returns last N points
- [ ] POST /api/zones stores bbox zone
- [ ] GET /api/alerts returns latest alerts
- [ ] Basic dedupe or cooldown to prevent alert spam

## Telemetry generator MVP
- [ ] Generates at least 2 moving objects with believable routes
- [ ] Emits 1 Hz updates
- [ ] Posts to backend successfully

## If time is short, cut in this order
1. WebSocket streaming (use polling)
2. Polygon drawing (bbox only)
3. Low confidence and stale rules (enter/exit only)
4. Multi-object filters and UI polish
