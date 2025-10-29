# UC13 — Báo cáo sự cố thiết bị (Report Device Incident)

## Mục tiêu
Cho phép Field Worker hoặc tự động hệ thống báo cáo sự cố thiết bị (failure, malfunction) để kỹ thuật viên xử lý.

## Actors
- Field Worker
- Technician (assignee)
- System (automatic incident detection)
- Dashboard UI

## System Components (Lifelines)
- UI / Mobile App
- API Gateway (REST)
- IncidentController / IncidentService
- DeviceService
- Alerting / NotificationService
- IncidentRepository (DB)
- Event Bus
- Task/WorkOrder System (optional)

## Preconditions
- User authenticated (for manual reporting).
- Device is registered.

## Postconditions
- Incident ticket created with status `new` and assigned/queued for technician.
- Notifications to on-call technicians (optional).
- Incident appears in technician queue.

---

## Main Flow (Manual report by Field Worker)
Participants: Field Worker → UI → API Gateway → IncidentController → IncidentService → IncidentRepository → DB → Event Bus → NotificationService → Technician UI

1. Field Worker selects device and fills incident form (type: malfunction, description, photos, urgency).
2. UI sends `POST /api/incidents` with payload { deviceId, description, severity, attachments }.
3. API Gateway authenticates user and authorizes.
4. IncidentController validates payload and calls IncidentService.createIncident(payload, reporterId).
5. IncidentService enriches incident (device metadata, location), creates DB record via IncidentRepository with status `new`.
6. IncidentService emits `INCIDENT_CREATED` event.
7. NotificationService listens and determines assignee(s)/on-call technician(s) by availability and notifies via WebSocket/email/SMS.
8. Incident appears in Technician's queue UI; technician can accept and change status to `in-progress`.
9. Incident updates are recorded and broadcast via Event Bus.

## Main Flow (Automatic detection → auto-create incident)
Participants: DataCollector/AutomationService → Event Bus → IncidentService → IncidentRepository → NotificationService

1. System detects repeated actuator failures or device offline for extended time and emits `DEVICE_HEALTH_ISSUE`.
2. IncidentService (listener) creates incident automatically with type `device-health` and priority calculated.
3. Continue with steps 5–9 from manual flow.

## Alternate Flows
- AF1: Missing device metadata — IncidentService attaches minimal info and marks for triage.
- AF2: Quick dismissal — technician marks incident `false-positive`, incident closed with resolution note.
- AF3: No on-call tech — escalate to admin.

## Data contracts
- Incident object:
```json
{ "id":"inc-123", "deviceId":"pump-01", "reporterId":"u-55", "severity":"high", "description":"Pump not starting", "attachments":["url1"], "status":"new", "createdAt":"..." }
```

## Diagram notes
- Sequence diagrams: manual report flow (UI→API→IncidentService→DB→Notification), automatic detection flow (AutomationService→Event Bus→IncidentService→DB→Notification).
- Communication diagram: show Event Bus as the connector between detection and incident creation; NotificationService connecting to external channels.

## Edge cases
- Duplicate reports for same ongoing incident — IncidentService should detect duplicates using deviceId+time window and either attach information to existing incident or create a linked one.
- Sensitive attachments — scan for large files and offload to object storage (S3) with signed URLs.

## Test cases
1. Submit incident via UI and verify DB record, notification to technician and UI display.
2. Simulate automatic failure detection; verify incident created and assigned.

---

File: `docs/use-cases/UC13_Report_Incident.md`