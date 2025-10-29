# UC03 — Điều khiển thiết bị thủ công (Manual Device Control)

## Mục tiêu
Cho phép người dùng (Owner/Technician/Worker) bật/tắt hoặc gửi lệnh thủ công tới actuator (bơm, quạt, đèn) từ dashboard.

## Actors
- User (Owner / Technician / Field Worker)
- Dashboard UI

## System Components (Lifelines)
- UI (Browser / Mobile)
- API Gateway (REST)
- DeviceController / ActuatorService
- MQTT Broker
- Actuator Device (hardware)
- Event Bus
- Audit / ActionLog Service

## Preconditions
- Người dùng đã đăng nhập và có quyền điều khiển thiết bị.
- Thiết bị đã đăng ký và kết nối đến MQTT broker.

## Postconditions
- Thiết bị nhận lệnh và thay đổi trạng thái.
- Hệ thống ghi log hành động và cập nhật dashboard trạng thái.

---

## Main Flow (REST → MQTT)
Participants: UI → API Gateway → ActuatorService → MQTT Broker → Actuator → DataCollector/EventBus → UI

1. User clicks "Turn ON" on the dashboard for `actuatorId`.
2. UI sends `POST /api/devices/{actuatorId}/commands` with payload { command: "on", params: {...} }.
3. API Gateway authenticates and authorizes the user.
4. API Gateway forwards request to ActuatorService/DeviceController.
5. ActuatorService validates actuator existence and mapping to farmZone.
6. ActuatorService creates an ActionLog entry (Audit) with status `pending`.
7. ActuatorService publishes MQTT message to topic `actuators/{farmZone}/{actuatorId}/commands` with command payload.
8. MQTT Broker delivers message to actuator device.
9. Actuator executes command and optionally publishes status update to `actuators/{actuatorId}/status`.
10. DataCollector (or ActuatorService subscription) receives status update and persists to DB.
11. Event Bus emits `DEVICE_STATUS_CHANGED` and WebSocket Gateway broadcasts updated status to UI.
12. ActuatorService updates ActionLog status to `completed` and returns HTTP 200 to UI.
13. UI shows success and updated status.

## Alternate Flows
- AF1: Device offline — If no acknowledgement within timeout, ActuatorService marks ActionLog as `failed` and responds HTTP 504 with error message. Notification may be sent to the user.
- AF2: Unauthorized user — API returns HTTP 403.
- AF3: Validation fail (invalid command) — API returns HTTP 400 with error details.

## Data contracts
- Command payload (REST):
```json
{ "command": "on", "params": { "duration": 60 } }
```
- MQTT command payload:
```json
{ "cmdId": "uuid-1234", "command": "on", "params": {"duration":60}, "timestamp": "2025-10-30T09:00:00Z" }
```
- Actuator status event:
```json
{ "actuatorId": "pump-01", "status": "on", "timestamp": "..." }
```

## Diagram notes
- Sequence diagram: UI→API→ActuatorService→MQTT→Actuator→(status)→DataCollector→EventBus→WebSocket→UI.
- Communication diagram: REST channel between UI and API Gateway; MQTT between ActuatorService and Actuator; DB link for logs/status.

## Edge cases and retries
- Command deduplication on device side (cmdId).
- Retry policy: ActuatorService retries N times before marking failed.
- Circuit breaker to avoid sending commands if actuator repeatedly fails.

## Test cases
1. Send valid ON command; assert device receives it and UI updates status.
2. Simulate device offline; assert ActionLog marked failed and API returns timeout.

---

File: `docs/use-cases/UC03_Manual_Device_Control.md`