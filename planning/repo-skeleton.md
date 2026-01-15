geofence-tracker/
  README.md
  package.json (optional root)
  package-lock.json

  planning/
    MVP.md
    repo-skeleton.md
    day1.md
    day2.md
    day3.md

  schemas/
    telemetry_point.schema.json
    telemetry_batch_request.schema.json
    object_summary.schema.json
    objects_list_response.schema.json
    telemetry_list_response.schema.json
    zone.schema.json
    zones_list_response.schema.json
    alert_event.schema.json
    alerts_list_response.schema.json
    api_error.schema.json
    api_ok.schema.json

  backend/
    README.md
    pyproject.toml
    database_v2.db
    src/
      app/
        main.py
        api/
          routes_objects.py
          routes_telemetry.py
          routes_zones.py
          routes_alerts.py
        db/
          session.py
          models.py
        services/
          ingestion.py
          zone_eval.py
        tests/
          # Tests files

  frontend/
    index.html
    package.json
    vite.config.ts
    tsconfig.json
    src/
      main.tsx
      index.css
      app/
        App.tsx
        api/
          client.ts
          types.ts
        components/
          MapView.tsx
          MapView.css
          Sidebar.tsx
          Sidebar.css
          Overlay.tsx
          Overlay.css
          AlertsPanel.tsx
          AlertsPanel.css

  tools/
    telemetry_generator/
      generator.py
      README.md
      requirements.txt
