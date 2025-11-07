# UC03 — Điều khiển thiết bị thủ công (Manual Device Control)

## Goal
Cho phép operator bật/tắt/toggle actuator từ dashboard và quan sát kết quả ngay lập tức qua MQTT + WebSocket.

## Actors
- Owner / Technician / Field Worker
- Actuator thiết bị (pump, fan, valve…)

## Components (Lifelines)
- React Dashboard (`ActuatorManagement`)
- API Gateway → `DeviceController`
- `ActuatorService` + `ActuatorRepository`
- `MqttPublishService` (gửi lệnh), `MqttHandler` (nhận status)
- MQTT Broker
- Event Bus + WebSocket Gateway (broadcast `device:controlled`)
- MongoDB (lưu trạng thái actuator)

## Preconditions
- Actuator đã được seed/đăng ký (ActuatorRepository) và có `deviceId` hợp lệ.
- `ENABLE_MQTT=true` hoặc có gRPC server nếu sử dụng đường gRPC.
- Người dùng đăng nhập và có quyền điều khiển.

## Postconditions
- Command được gửi tới thiết bị qua MQTT (hoặc gRPC).
- Trạng thái actuator trong DB được cập nhật; sự kiện realtime đẩy tới UI.

---

## Main Flow — REST ➝ MQTT
1. Người dùng chọn thiết bị trên dashboard và gửi lệnh `POST /api/devices/control/:deviceId` với body `{ "command": "on" }`.
2. `DeviceController` (Express) validate bằng Joi → xác định user đang điều khiển.
3. `ActuatorService.controlDevice()` tra cứu thiết bị, kiểm tra command (`on/off/toggle`).
4. Service gọi `MqttPublishService.publishControlCommand()` → publish tới topic `devices/{deviceId}/control` (thay ký tự `+` trong cấu hình).
5. Thiết bị nhận lệnh và phản hồi (tuỳ thiết kế) qua topic status.
6. `ActuatorRepository.updateStatus()` cập nhật DB và trả thiết bị mới.
7. Service phát `eventBus.publish(Events.DEVICE_CONTROLLED, { deviceId, command, controlledBy, timestamp })`.
8. WebSocket Gateway lắng nghe event → phát `device:controlled` cho toàn bộ client.
9. API trả HTTP 200 với dữ liệu thiết bị → UI hiển thị thành công và trạng thái mới.

## Optional Flow — gRPC Control
1. UI/automation gửi `POST /api/devices/grpc/control/:deviceId` body `{ "action": "TURN_ON", "address": "host:50051" }`.
2. Controller lấy gRPC client (`GrpcClient`) gọi `controlActuator`.
3. Kết quả trả về dùng `ActuatorService.updateActuatorStatus()` cập nhật DB và phát event tương tự.

## Alternate / Exception
- **Device không tồn tại:** ActuatorService ném lỗi → API trả 404.
- **Command không hợp lệ:** Joi hoặc service trả 400, không publish MQTT.
- **MQTT broker unreachable:** `MqttPublishService` ném lỗi → API trả 500 và log.
- **Device ở chế độ auto:** Service log cảnh báo, vẫn có thể override nếu cần (ghi `controlledBy=user`).

## Data Contracts
- **REST request:**
```json
POST /api/devices/control/pump-main-zone-123
{ "command": "off" }
```
- **MQTT control payload (theo MqttPublishService):**
```json
{
	"deviceId": "pump-main-zone-123",
	"command": "off",
	"timestamp": "2025-11-07T15:40:00.123Z"
}
```
- **WebSocket broadcast:**
```json
{
	"event": "device:controlled",
	"timestamp": "2025-11-07T15:40:00.456Z",
	"data": {
		"deviceId": "pump-main-zone-123",
		"command": "off",
		"controlledBy": "tech.nguyen"
	}
}
```

## Diagram / Slide Notes
- Sequence: UI → API Gateway → DeviceController → ActuatorService → MQTT broker → Device → (status) → EventBus/WebSocket → UI.
- Highlight Logging tại ActuatorService và MQTT Publish; optional nhánh gRPC.

## Acceptance Checks
1. Gửi lệnh ON qua REST, quan sát log MQTT và WebSocket, DB cập nhật status.
2. Tắt broker → lệnh trả lỗi 500, log cảnh báo.
3. Thử gRPC endpoint với server demo → xác nhận response và DB cập nhật.

## Additional Specifications
- **Authorization matrix:**
	- Owner, Technician: toàn quyền điều khiển actuator trong farm.
	- Field Worker: chỉ những actuator thuộc zone được phân công (`user.zoneIds`).
	- Automation engine: sử dụng service account (`ROLE_AUTOMATION`) qua internal token.
- **Audit logging:** `ActionLogRepository` ghi nhận `{ commandId, deviceId, command, status, issuedBy, context }`; log Winston ở mức `info` khi publish và `error` với stacktrace khi thất bại.
- **Config toggles:**
	- `ENABLE_MQTT=false` → API trả 503 “MQTT disabled”; không cố publish.
	- `MQTT_TOPIC_DEVICE_CONTROL` mặc định `devices/+/control`; có thể override bằng env.
- **Timeout & retry:** `ActuatorService` timeout mặc định 5s (configurable); retry 2 lần với backoff 500ms.
- **Data retention:** Action logs lưu 90 ngày (TTL index); trạng thái actuator cập nhật tại collection `ActuatorStatus` với field `lastCommandId` để truy vết.
- **Observability:** Metrics đẩy qua `shared-kernel/utils/metrics` (counter `device_control_success_total`, `device_control_failure_total`). Alerts nếu tỉ lệ fail > 5% trong 5 phút.