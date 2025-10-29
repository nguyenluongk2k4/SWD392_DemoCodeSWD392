# UC12 — Xem tình trạng thiết bị (View Device Status)

## Mục tiêu
Cho phép Technician/Owner theo dõi trạng thái (ON/OFF/ERROR/ONLINE/OFFLINE) của actuator devices theo thời gian thực.

## Actors
- Technician / Owner
- Dashboard UI

## System Components (Lifelines)
- UI
- API Gateway (REST)
- DeviceService / ActuatorService
- MQTT Broker
- Actuator Device
- DataCollector (listens to actuator status topics)
- Event Bus
- WebSocket Gateway
- Database (device status history)

## Preconditions
- Device registered with system and publishes status updates to MQTT topic `actuators/{zone}/{deviceId}/status`.
- UI connected via WebSocket for real-time updates (optional polling via REST).

## Postconditions
- Latest device status displayed; history accessible; events logged.

---

## Main Flow (Real-time status via MQTT → WS)
Participants: Actuator → MQTT Broker → DataCollector → DB → Event Bus → WebSocket Gateway → UI

1. Actuator publishes `status` message periodically or after state change to `actuators/{zone}/{deviceId}/status` with payload {deviceId, status, lastSeen, details}.
2. MQTT Broker forwards to DataCollector.
3. DataCollector validates and writes/update current device status record in DB (device table/status collection) and appends to history collection.
4. DataCollector emits `DEVICE_STATUS_CHANGED` event on Event Bus with payload { deviceId, status, farmZone, timestamp }.
5. WebSocket Gateway receives event and broadcasts to subscribed UI clients (room `devices-{zone}`) with the updated status.
6. UI updates device list and detail view; if status is `ERROR` or `OFFLINE`, UI highlights device and may show recommended actions.

## Main Flow (On-demand REST query)
Participants: UI → API Gateway → DeviceService → Database → API Gateway → UI

1. UI requests `GET /api/devices/{deviceId}/status` or `GET /api/devices?zone=zone-1`.
2. API Gateway authenticates & authorizes.
3. DeviceService queries DB for latest status and optionally history.
4. DB returns result; API returns 200 with payload.
5. UI renders status and optionally history chart.

## Alternate Flows
- AF1: Device offline — DataCollector receives no status for timeout period; creates `DEVICE_OFFLINE` event and sets device status accordingly.
- AF2: Stale data detected — if timestamp is older than threshold, mark as stale and notify user.

## Data contracts
- Status payload:
```json
{ "deviceId":"pump-01", "status":"on", "lastSeen":"2025-10-30T09:45:00Z", "details": { "voltage":12.2 } }
```
- REST response: { deviceId, status, lastSeen, lastUpdatedBy (optional), history: [...] }

## Diagram notes
- Sequence diagram lifelines: Actuator, MQTT Broker, DataCollector, DB, Event Bus, WebSocket, UI.
- Communication diagram: MQTT channel for physical devices; WS/REST for UI; DB for persistence.

## Edge cases
- Duplicate status messages — handle idempotency by comparing timestamps.
- Rapid status flapping — implement debouncing and only propagate meaningful changes.

## Test cases
1. Publish ON/OFF status from device; assert UI receives update and DB recorded entry.
2. Stop device heartbeats; assert system marks device OFFLINE after timeout.

---

File: `docs/use-cases/UC12_View_Device_Status.md`