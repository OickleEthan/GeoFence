# Day 3 (Polish + Robustness + README)

## Goal
Make it interview-ready: clarity, reliability, and good explanations.

## Robustness
- [ ] STALE state: mark objects stale if last_seen exceeds threshold
- [ ] Optional rule: LOW_CONFIDENCE_IN_ZONE
- [ ] Anti-spam improvements: cooldown window per object/zone/rule
- [ ] Handle out-of-order telemetry: ignore older than last accepted ts

## UI polish
- [ ] Filters: category, status, confidence threshold
- [ ] Better details panel (speed, heading, confidence, last seen age)
- [ ] Map usability (follow object toggle optional)

## README
- [ ] Fill architecture section with diagrams or ASCII blocks
- [ ] Document tradeoffs and failure modes
- [ ] Document run instructions and demo steps

## Optional if time remains
- [ ] WebSocket streaming for telemetry + alerts
- [x] Polygon drawing tool (upgrade from bbox)

## Final deliverable
Clean repo with reproducible run instructions and a crisp 1–2 page design explanation.
