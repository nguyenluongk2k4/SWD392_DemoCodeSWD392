# UC04 — Tự động tưới nước / thông gió (Auto Irrigation / Ventilation)

## Mục tiêu
Hệ thống tự động kích hoạt actuators (bơm, quạt) dựa trên ngưỡng đã cấu hình để duy trì điều kiện môi trường phù hợp.

## Actors
- System (Automation Engine)
- DataCollector

## System Components (Lifelines)
- Sensor Device
- MQTT Broker
- DataCollector Service
- Event Bus
- ThresholdService
- AutomationService (Rule Engine)
- ActuatorService
- Actuator Device
- NotificationService (optional)
- Database

## Preconditions
- Active thresholds đã được cấu hình cho sensorType / farmZone.
- Sensors publishing data.
- Actuators registered and reachable.

## Postconditions
- Actuator lệnh được gửi và hành động được thực hiện.
- Nếu cần, alert được tạo và thông báo đến người dùng.

---

## Main Flow (Sensor triggers automation)
Participants: Sensor → MQTT Broker → DataCollector → Event Bus → AutomationService → ThresholdService → AutomationService → ActuatorService → MQTT Broker → Actuator

1. Sensor publishes data to `sensors/{zone}/{sensorId}/data`.
2. MQTT Broker routes to DataCollector.
3. DataCollector validates and persists data into DB.
4. DataCollector emits `SENSOR_DATA_RECEIVED` event on Event Bus with payload { sensorId, sensorType, value, timestamp, farmZone }.
5. AutomationService (subscribed to `SENSOR_DATA_RECEIVED`) receives event and queries ThresholdService for active thresholds matching sensorType and farmZone.
6. ThresholdService returns list of active thresholds and their actions.
7. AutomationService evaluates value against each threshold using threshold.isViolated(value) logic.
8. If violation detected, AutomationService determines action (e.g., `deviceId`, `deviceAction`, `priority`) and emits `THRESHOLD_EXCEEDED` event and/or directly calls ActuatorService.
9. ActuatorService composes command and publishes MQTT message to `actuators/{zone}/{deviceId}/commands`.
10. MQTT Broker delivers to actuator; actuator executes command and returns status.
11. DataCollector (or ActuatorService) records status; Event Bus emits `DEVICE_STATUS_CHANGED`.
12. If configured, AutomationService triggers NotificationService to create/send alert (ALERT_CREATED → NotificationService sends email/SMS/push).
13. UI clients receive updates via WebSocket.

## Alternate Flows
- AF1: Multiple thresholds conflict — AutomationService applies priority rules (severity, timestamp, manual overrides); logs decision and may create an incident if conflict unresolved.
- AF2: Actuator unreachable — AutomationService retries, creates alert for operator, and may fallback to safe mode.
- AF3: Threshold temporarily disabled — ThresholdService returns none, AutomationService does nothing.

## Data contracts
- Threshold object (simplified):
```json
{ "id":"thr-1", "sensorType":"soil-moisture", "minValue":10, "maxValue":30, "action":{ "type":"device", "deviceId":"pump-01", "deviceAction":"on" }, "isActive":true }
```
- THRESHOLD_EXCEEDED event:
```json
{ "thresholdId":"thr-1", "sensorId":"sensor-12", "value":5, "farmZone":"zone-1", "timestamp":"..." }
```

## Diagram notes
- Sequence diagram main lifelines: Sensor, Broker, DataCollector, Event Bus, AutomationService, ThresholdService, ActuatorService, Actuator, NotificationService, UI.
- Communication diagram: show Event Bus as central hub; MQTT channel between services and devices; REST between UI and API services for management and logs.

## Edge cases & decision rules
- Decision arbitration: when multiple thresholds apply, sort by severity then last-updated.
- Hysteresis: support min/max with hysteresis window to prevent flapping (on/off oscillation).
- Rate limits: only trigger device action if last action older than X seconds to prevent thrashing.

## Test cases
1. Publish low moisture value that violates threshold; assert actuator receives ON command and alert created.
2. Simulate actuator offline; assert retry and alert behavior.

## Additional Specifications
- **Config toggles:** `ENABLE_MQTT` và `ENABLE_DATABASE` phải bật để pipeline đầy đủ; `MQTT_TOPIC_SENSOR_DATA` và `MQTT_TOPIC_DEVICE_CONTROL` có thể override nhưng phải giữ wildcard (`sensors/#`, `devices/+/control`).
- **Threshold caching:** `AutomationService` nhận `threshold.created/updated/deleted` từ Event Bus để làm tươi cache; khởi động lại service cần load lại toàn bộ `ThresholdRepository` vào bộ nhớ.
- **Debounce & cooldown:** mỗi hành động device có `cooldownMs` (config trong threshold); `AutomationService` lưu `lastActionAt` để tránh spam thiết bị.
- **Audit & logging:** mọi quyết định tự động được log cấp `info` với `{ sensorId, thresholdId, deviceId, action }`; cảnh báo (`warn`) khi giá trị nằm ngoài ngưỡng an toàn tuyệt đối hoặc actuator không phản hồi.
- **Fail-safe:** nếu `ActuatorService` báo lỗi 3 lần liên tiếp, `AutomationService` phát thêm `incident.reported` cho UC13 và gửi alert mức `critical`.
- **Observability:** metric Prometheus `automation_actions_total{status="success|failure"}` và `threshold_violations_total` được increment; dashboards dùng để quan sát tần suất kích hoạt.

---

File: `docs/use-cases/UC04_Auto_Irrigation.md`