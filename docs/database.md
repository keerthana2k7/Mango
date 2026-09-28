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
- **trees**: Individual mango trees with row/column grid coordinates, variety, health status (`HEALTHY`, `DISEASE_DETECTED`, `TREATED`, `UNKNOWN`), and inspection timestamps.
- **cameras**: Rail-mounted inspection rigs, telemetry coordinates, and status (`ONLINE`, `MOVING`, `CAPTURING`, `OFFLINE`).
- **images**: Uploaded or simulated foliar captures stored in local filesystem / S3.
- **predictions**: ML classification outputs with confidence score, class ID, model version, disease symptoms, and agronomic treatment prescriptions.
- **treatments**: Agrochemical & cultural intervention audit trail per tree (`chemical_name`, `dosage`, `operator_name`, `treatment_type`, `notes`, `treated_at`).
- **alerts**: Automated pathogen detection warnings & camera alarms with severity ratings (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) and acknowledgment/resolution tracking.
