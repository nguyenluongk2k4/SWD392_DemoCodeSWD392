# UC09 — Gửi cảnh báo (Send Alerts: Email / SMS / Push)

## Mục tiêu
Khi hệ thống phát hiện sự kiện quan trọng (ví dụ: threshold exceeded, device failure), tạo Alert, lưu lại và gửi thông báo tới người dùng qua nhiều kênh (Email, SMS, Push, WebSocket).

## Actors
- System (AutomationService / NotificationService)
- Notification Provider(s) (SMTP, Twilio, FCM)
- End Users (Owner, Technician)
- UI (Dashboard)

## System Components (Lifelines)
- AutomationService
- NotificationService
- AlertRepository (DB)
- AlertingClients (Email, SMS, Push adapters)
- Event Bus
- WebSocket Gateway
- External Providers (SMTP, SMS Gateway, FCM)
- UserRepository (get recipients/settings)

## Preconditions
- Alerting channels configured (SMTP creds, Twilio keys, FCM keys).
- Recipient user(s) have contact info stored.

## Postconditions
- Alert record persisted with notifications status per channel.
- Notifications are sent; delivery result tracked if provider supports callbacks.
- UI shows alert and notification delivery statuses.

---

## Main Flow (Alert creation & multi-channel delivery)
Participants: AutomationService → Event Bus → NotificationService → AlertRepository → AlertingClients → External Provider → NotificationService → DB → WebSocket → UI

1. AutomationService detects event (e.g., THRESHOLD_EXCEEDED) and emits `ALERT_CREATE_REQUEST` with payload { type, severity, message, farmZone, relatedDevice }.
2. NotificationService (listener) receives request and calls AlertRepository.create(alertDraft) to persist an Alert with status `new` and `notifications: []`.
3. NotificationService determines recipients and channels using user preferences or default mapping (e.g., severity High → email+sms+push).
4. For each channel (email, sms, push):
   a. NotificationService adds a `notification` entry in Alert.notifications with channel, status=`pending`, recipient info and timestamp.
   b. NotificationService calls corresponding AlertingClient (sendEmail/sendSMS/sendPush) with message template.
5. AlertingClients invoke External Providers (SMTP/Twilio/FCM) and return a provider response (success/failure/messageId).
6. NotificationService updates Alert.notifications entry with status `sent` or `failed` and provider metadata.
7. After all channels processed, set Alert.status=`notified` if at least one success else `notification_failed`.
8. Emit `ALERT_NOTIFIED` event on Event Bus.
9. WebSocket Gateway receives `ALERT_CREATED`/`ALERT_NOTIFIED` and broadcasts to UI clients.
10. UI displays alert and per-channel delivery statuses.

## Delivery confirmation / callbacks
- If provider supports callbacks (webhooks), an endpoint like `POST /api/alerts/notifications/callback` accepts delivery receipts and updates Alert.notifications accordingly (delivered/undelivered).

## Retry strategy
- For transient provider errors, NotificationService retries with exponential backoff up to N attempts.
- Persistent failures create a task in operator queue for manual retry.

## Alternate Flows
- AF1: No contact info for recipients — NotificationService falls back to on-dashboard notification only and logs missing contact.
- AF2: Provider credentials invalid — mark channel as `failed`; notify admin via syslog/alert.

## Data contracts
- Alert record:
```json
{
  "id":"alert-123",
  "type":"threshold_exceeded",
  "severity":"high",
  "message":"Soil moisture below threshold in zone-1",
  "status":"notified",
  "notifications":[
    { "channel":"email","recipient":"owner@example.com","status":"sent","providerId":"msg-123" },
    { "channel":"sms","recipient":"+84901234567","status":"failed","error":"Provider timeout" }
  ],
  "createdAt":"..."
}
```

## Diagram notes
- Sequence diagram should include AutomationService → NotificationService → AlertingClient → External Provider, plus callback path Provider → API (webhook) → NotificationService.
- Communication diagram: show NotificationService connected to multiple external providers, DB for persistence, Event Bus to notify UI.

## Edge cases
- Rate limiting: ensure rate limits for SMS/Email; throttle high-volume alerts.
- Deduplication: suppress duplicate alerts within a time window (alert dedupe rules).

## Test cases
1. Trigger threshold exceeded; assert alert created, email sent (check logs), UI receives alert.
2. Simulate SMTP failure; verify retry and eventual failed status.

## Additional Specifications
- **Channel toggles:** cấu hình qua env `ENABLE_EMAIL_ALERTS`, `ENABLE_SMS_ALERTS`, `ENABLE_PUSH_NOTIFICATIONS`; NotificationService bỏ qua channel tắt và ghi chú trong alert.
- **Template management:** mẫu message lưu trong `components/monitoring-logging/presentation/templates`; hỗ trợ đa ngôn ngữ với biến `{zone}`, `{value}`, `{threshold}`.
- **Recipient preferences:** `UserRepository` lưu `alertPreferences` (severity → channels); NotificationService hợp nhất với mặc định hệ thống.
- **Rate limiting & dedupe:** áp dụng sliding window 5 phút; tạo `alert.hash` để loại bỏ thông báo trùng; log cảnh báo nếu vượt ngưỡng 30 alert/phút.
- **Delivery observability:** metrics `alerts_sent_total{channel,status}` và `alerts_latency_seconds`; logs cấp `info` khi thành công, `error` với `providerResponse` khi thất bại.
- **Failover:** nếu email thất bại ≥3 lần liên tiếp, chuyển sang push notification bắt buộc và phát `incident.reported` để đội vận hành kiểm tra kênh.

---

File: `docs/use-cases/UC09_Send_Alerts.md`