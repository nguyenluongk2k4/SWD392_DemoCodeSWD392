# UC02 — Xem dữ liệu cảm biến (View Sensor Data)

## Goal
Cung cấp dashboard hiển thị tức thời và truy vấn lịch sử cho từng cảm biến, dựa trên dữ liệu thu thập từ MQTT và được lưu chuẩn hóa trong MongoDB.

## Actors
- Farm Owner / Technician (người sử dụng dashboard)
- Sensor Device (thiết bị IoT)

## Components (Lifelines)
- Sensor → MQTT Broker (HiveMQ/Azure IoT, v.v.)
- DataCollectorService (components/data-ingestion)
- MongoDB time-series (`SensorData` collection)
- AutomationService (components/automation-engine)
- WebSocket Gateway (socket.io)
- API Gateway (Express REST)
- React Dashboard (`SensorData` component)
- Shared Event Bus (`shared-kernel/event-bus`)

## Preconditions
- `ENABLE_MQTT=true` và broker reachable, DataCollector đã subscribe `config.mqtt.topics.sensorData` (mặc định `sensors/#`).
- Sensors được seed trong DB (`Sensor` + liên kết farm/zone) để DataCollector map metadata.
- Người dùng đã đăng nhập hoặc sử dụng dashboard demo.

## Postconditions
- Bản ghi `SensorData` lưu kèm `sensor`, `sensorType`, `farmId`, `zoneId`, `sourceTopic`, `rawPayload`.
- UI nhận được bản cập nhật realtime qua socket `sensor:data:processed` và có thể lấy lịch sử qua REST.

---

## Main Flow — Realtime (MQTT ➝ Event Bus ➝ WebSocket)
1. **Sensor** publish tới topic ví dụ `sensors/zone-3a/temp-hc-01` với payload JSON chứa `sensorId`, `sensorType`, `value`, `timestamp`, v.v.
2. **MqttHandler** nhận message, log, sau đó `eventBus.publish(Events.SENSOR_DATA_RECEIVED, {...})`.
3. **DataCollectorService** subscribe `SENSOR_DATA_RECEIVED` → chuẩn hóa dữ liệu:
	 - Tra `SensorRepository.findByCode(sensorId)` để lấy `_id`, `sensorType`, `farmId`, `zoneId`.
	 - Chuyển `value` sang `Number`, gán `sourceTopic`, `rawPayload`.
4. DataCollector log document, lưu bằng `SensorDataRepository.create()` (Mongoose) -> MongoDB.
5. Sau khi lưu, DataCollector `eventBus.publish(Events.SENSOR_DATA_PROCESSED, {...})` chứa `sensorData`, `sensor`, `farm`, `zone`.
6. **WebSocket Gateway** subscribe cả `SENSOR_DATA_RECEIVED` và `SENSOR_DATA_PROCESSED` và broadcast lần lượt `sensor:data`, `sensor:data:processed` qua socket.io.
7. **React SensorData component** lắng nghe `sensor:data:processed` → cập nhật danh sách cảm biến realtime, ghi log và set `lastUpdate` trên status bar.

## Main Flow — Historical (REST)
1. UI gửi `GET /api/demo/sensor-data?limit=6` (hoặc thêm `sensorId=temp-sensor-01`).
2. **API Gateway** chuyển tiếp tới `DemoController.getSensorData`.
3. Controller gọi `SensorDataRepository.getRecentData()` hoặc `findBySensorId()` tùy tham số.
4. MongoDB trả về dữ liệu đã populate sensor/sensorType/farm/zone.
5. API phản hồi HTTP 200 và UI render cards, cho phép người dùng nhấn “Refresh”.

## Alternate / Exception
- **MQTT tạm ngắt:** `config.mqtt.enabled=false` → hệ thống chỉ trả dữ liệu demo qua REST; Status bar báo `disconnected`.
- **Sensor chưa tồn tại:** DataCollector log cảnh báo và bỏ qua message (metadata không map được).
- **Payload sai định dạng:** DataCollector từ chối lưu, ghi log và tiếp tục phục vụ các message hợp lệ.

## Data Contracts
- **MQTT inbound payload:**
```json
{
	"sensorId": "ph-sensor-02",
	"sensorType": "pH",
	"farmId": "farm-003",
	"zoneId": "zone-3a",
	"value": 36.5,
	"timestamp": "2025-11-07T14:25:00Z"
}
```
- **MongoDB `SensorData` document:**
```json
{
	"sensor": "ObjectId(...)",
	"sensorType": "ObjectId(...)",
	"farmId": "ObjectId(...)",
	"zoneId": "ObjectId(...)",
	"value": 36.5,
	"timestamp": "2025-11-07T14:25:00Z",
	"quality": "critical",
	"sourceTopic": "sensors/zone-3a/temp-hc-01",
	"rawPayload": { "sensorId": "ph-sensor-02", ... }
}
```
- **WebSocket broadcast (`sensor:data:processed`):**
```json
{
	"event": "sensor:data:processed",
	"timestamp": "2025-11-07T14:25:01.123Z",
	"data": {
		"sensorData": { "_id": "...", "value": 36.5, "timestamp": "..." },
		"sensor": { "sensorId": "ph-sensor-02", "sensorType": { "name": "ph" } },
		"farm": { "name": "Hydroponic Farm TP.HCM" },
		"zone": { "name": "Hệ thống Hydroponic 1" }
	}
}
```
- **REST response (`/api/demo/sensor-data`):**
```json
{
	"success": true,
	"data": {
		"mqttConnected": true,
		"lastUpdated": "2025-11-07T14:25:01Z",
		"sensorData": [ /* danh sách bản ghi đã populate */ ]
	}
}
```

## Diagram / Slide Notes
- Sequence: Sensor → MQTT → MqttHandler → EventBus → DataCollector → MongoDB → EventBus → WebSocket → React.
- Làm rõ điểm log và enrich tại DataCollector; highlight socket event và UI cập nhật tức thời.

## Acceptance
1. Gửi payload mẫu qua MQTT → mong đợi log `Sensor data saved` + UI cập nhật realtime.
2. Gọi REST với `sensorId` cụ thể → nhận đúng dữ liệu populate.
3. Tắt broker → dashboard vẫn trả lịch sử, status báo `disconnected`.



2,3 4,5 6,7,9,12,13 14