# UC05 — Cấu hình ngưỡng (Configure Thresholds)

## Mục tiêu
Cho phép Owner/Technician tạo, sửa, xóa, bật/tắt các ngưỡng (thresholds) cho từng loại cảm biến và farmZone.

## Actors
- Owner / Technician
- Dashboard UI

## Components (Lifelines)
- UI
- API Gateway (REST)
- ThresholdController
- ThresholdService
- ThresholdRepository (DB)
- Event Bus
- Audit/Logs

## Preconditions
- User đã đăng nhập và có quyền quản trị ngưỡng.

## Postconditions
- Threshold mới được lưu, event `THRESHOLD_CREATED/UPDATED/DELETED` được phát, AutomationService có thể nhận thay đổi ngay.

---

## Main Flow (Create threshold)
Participants: UI → API Gateway → ThresholdController → ThresholdService → ThresholdRepository → DB → Event Bus → AutomationService

1. User opens "Create Threshold" dialog and fills fields (name, sensorType, minValue, maxValue, action, farmZone, isActive).
2. UI sends `POST /api/thresholds` with threshold body.
3. API Gateway authenticates & authorizes the user.
4. ThresholdController validates input (Joi), then calls ThresholdService.createThreshold(payload).
5. ThresholdService ensures business rules (no overlapping thresholds for same sensorType+zone if disallowed) and calls ThresholdRepository.create(threshold).
6. ThresholdRepository persists document into DB and returns saved object.
7. ThresholdService emits `THRESHOLD_CREATED` event on Event Bus with threshold details.
8. AutomationService (subscribed) receives event and updates its in-memory rules/cache accordingly to apply new threshold immediately.
9. ThresholdController returns HTTP 201 with saved threshold.
10. UI shows confirmation.

## Update flow (Edit threshold)
1. UI sends `PUT /api/thresholds/{id}` with updated body.
2. ThresholdService validates and updates DB via ThresholdRepository.update(id, body).
3. Event `THRESHOLD_UPDATED` emitted; AutomationService refreshes cached rules.

## Delete flow
1. UI sends `DELETE /api/thresholds/{id}`.
2. ThresholdRepository deletes or marks as inactive (soft delete).
3. Event `THRESHOLD_DELETED` emitted.

## Toggle activate/deactivate
1. UI hits `PATCH /api/thresholds/{id}/toggle`.
2. ThresholdService toggles `isActive` and emits `THRESHOLD_UPDATED`.

## Alternate Flows
- AF1: Attempt to create overlapping thresholds — ThresholdService rejects with HTTP 409 if rule exists.
- AF2: Unauthorized — API returns 403.

## Data contracts
- Threshold payload:
```json
{ "name":"High Temp", "sensorType":"temperature", "minValue":null, "maxValue":35, "action":{ "type":"device", "deviceId":"fan-01", "deviceAction":"on" }, "farmZone":"zone-1", "isActive":true }
```
- Event payload (THRESHOLD_CREATED / UPDATED): threshold full object with id and metadata.

## Diagram notes
- Sequence diagram: UI→API→ThresholdService→DB; event emission to Event Bus → AutomationService update.
- Communication diagram: REST between UI/API; Event Bus link between ThresholdService and AutomationService; DB for persistence.

## Edge cases and business rules
- Overlapping thresholds: define policy (allow/disallow). If disallowed, block create and return informative message with existing thresholds.
- Validation: min < max, numeric ranges, required action mapping.
- Soft delete vs hard delete: prefer soft delete with `isActive=false` for audit.

## Test cases
1. Create threshold valid → assert DB saved + event emitted + AutomationService cache updated.
2. Edit threshold → assert `THRESHOLD_UPDATED` emitted and rules changed.
3. Attempt overlapping threshold → assert HTTP 409 and message.

## Additional Specifications
- **Authorization:** chỉ Owner/Technician với permission `thresholds:manage`; thao tác ghi log vào `ActionLog` với `performedBy`.
- **Validation rules:** Joi schema bắt buộc `sensorType`, `farmZone`, `action.deviceId`; hỗ trợ `hysteresis` và `cooldownMs`; `minValue` và `maxValue` cho phép `null` nhưng không đồng thời null.
- **Caching:** `ThresholdService` phát `Events.THRESHOLD_CREATED|UPDATED|DELETED`; `AutomationService` và bất kỳ worker nào subscribe để cập nhật cache nội bộ ngay lập tức.
- **Versioning & audit:** mỗi threshold lưu `revision` tăng dần; thay đổi quan trọng lưu snapshot vào `ThresholdHistory` với diff để truy vết quyết định tự động.
- **Bulk operations:** API hỗ trợ import/export CSV/JSON (qua endpoint phụ); validate từng dòng, rollback nếu sai cấu trúc.
- **Configuration limits:** giới hạn 100 thresholds mỗi zone mặc định (configurable) để tránh quá tải; cảnh báo khi đạt 80%.

---

File: `docs/use-cases/UC05_Configure_Thresholds.md`