# Database Schema Documentation

## Relational Entity Diagram

```
Farm (1) ──────────< (N) Trees (1) ──────────< (N) Predictions
  │                       │                           ▲
  │ (1:N)                 │ (1:N)                     │ (1:1)
  ▼                       ▼                           │
Cameras (1) ───────< (N) Images ──────────────────────┘
```

## Tables & Constraints
- **users**: User authentication, passwords (bcrypt), and roles (`ADMIN`, `FARM_MANAGER`, `OPERATOR`).
- **farms**: Farm properties, physical parcel bounds, and grid layout definition (`total_rows`, `trees_per_row`).
- **trees**: Individual mango trees with row/column grid coordinates, variety, health status (`HEALTHY`, `DISEASE_DETECTED`, `UNKNOWN`), and inspection timestamps.
- **cameras**: Rail-mounted inspection rigs, telemetry coordinates, and status (`ONLINE`, `MOVING`, `CAPTURING`, `OFFLINE`).
- **images**: Uploaded or simulated foliar captures stored in local filesystem / S3.
- **predictions**: ML classification outputs with confidence score, class ID, model version, disease symptoms, and agronomic treatment prescriptions.
