# 🧩 Smart Agriculture System (SAS) - Software Specification Document

## 1. Tổng quan hệ thống
**Smart Agriculture System (SAS)** là ứng dụng IoT giúp người nông dân và kỹ thuật viên:
- Theo dõi môi trường nông trại (nhiệt độ, độ ẩm, ánh sáng, độ ẩm đất).
- Tự động điều khiển thiết bị như bơm nước, quạt, đèn.
- Giám sát, quản lý và lưu trữ dữ liệu qua MQTT, WebSocket và REST API.

---

## 2. Các Actor chính

| Actor | Vai trò / Chức năng |
|-------|----------------------|
| **Farm Owner (Chủ trang trại)** | Quản lý toàn bộ hệ thống: xem dữ liệu, thiết lập ngưỡng, tạo người dùng, xem báo cáo. |
| **Technician (Nhân viên kỹ thuật)** | Theo dõi dữ liệu, điều khiển thiết bị, cập nhật ngưỡng, xử lý sự cố. |
| **Field Worker (Người làm nông)** | Bật/tắt thiết bị thủ công, báo lỗi. |
| **Admin (Quản trị hệ thống)** | Quản lý hạ tầng: MQTT Broker, REST API, phân quyền, sao lưu dữ liệu. |

---

## 3. Các Use Case chính

| ID | Use Case | Actor | Mô tả |
|----|-----------|--------|-------|
| UC01 | Đăng nhập / Xác thực | Tất cả | Đăng nhập vào hệ thống web/mobile |
| UC02 | Xem dữ liệu cảm biến | Owner, Technician | Hiển thị dữ liệu real-time (nhiệt độ, độ ẩm, ánh sáng, đất) |
| UC03 | Điều khiển thiết bị thủ công | Owner, Technician, Worker | Bật/tắt thiết bị qua dashboard |
| UC04 | Tự động tưới nước / thông gió | System | Kích hoạt thiết bị khi vượt ngưỡng |
| UC05 | Cấu hình ngưỡng | Owner, Technician | Đặt giá trị max/min cảm biến |
| UC06 | Quản lý người dùng | Admin, Owner | CRUD tài khoản, gán vai trò |
| UC07 | Phân quyền vai trò | Admin | Thiết lập quyền từng nhóm |
| UC08 | Xem báo cáo hoạt động | Owner | Xem thống kê và lịch sử dữ liệu |
| UC09 | Gửi cảnh báo | System | Thông báo Email/SMS khi vượt ngưỡng |
| UC10 | Xem nhật ký hoạt động | Admin, Owner | Theo dõi log người dùng |
| UC11 | Cấu hình Broker/API | Admin | Thiết lập MQTT, WS, REST Endpoint |
| UC12 | Xem tình trạng thiết bị | Technician | Theo dõi ON/OFF |
| UC13 | Báo cáo sự cố thiết bị | Field Worker | Báo lỗi từ hiện trường |
| UC14 | Sao lưu / Phục hồi dữ liệu | Admin | Backup và restore toàn bộ dữ liệu |

---

## 4. Các chức năng chính (Functions)

| ID | Function Name | Mô tả | Liên quan | Status |
|----|----------------|-------|-----------|--------|
| F1 | readSensorData() | Đọc dữ liệu cảm biến qua MQTT | SensorControl | ✅ Implemented |
| F2 | publishActuatorCommand() | Gửi lệnh điều khiển | IrrigationManager | ✅ Implemented |
| F3 | autoControl() | So sánh ngưỡng và tự động kích hoạt thiết bị | AutomationService | ✅ Implemented |
| F4 | storeSensorData() | Lưu dữ liệu cảm biến vào DB | DataCollector | ✅ Implemented |
| F5 | getRealTimeData() | Cập nhật dashboard real-time | UIDashboard | ⏳ API Ready |
| F6 | getHistoricalData() | Lấy dữ liệu lịch sử | DataCollector | ⏳ Planned |
| F7 | updateThreshold() | Cập nhật ngưỡng điều khiển | ThresholdService | ✅ Implemented |
| F8 | manageUser() | Quản lý người dùng | UserService | ✅ Implemented |
| F9 | configureBroker() | Cập nhật endpoint MQTT/WS/REST | Config | ✅ Implemented |
| F10 | sendAlert() | Gửi cảnh báo Email/SMS/Push | NotificationService | ✅ Implemented |
| F11 | acknowledgeAlert() | Xác nhận đã nhận cảnh báo | NotificationService | ✅ Implemented |
| F12 | resolveAlert() | Giải quyết cảnh báo | NotificationService | ✅ Implemented |

---

## 5. Phương thức kết nối

| Phương thức | Mục đích | Component liên quan |
|--------------|----------|----------------------|
| MQTT | Gửi/nhận dữ liệu sensor & lệnh điều khiển | SensorControl, DataCollector |
| WebSocket | Cập nhật dashboard real-time | UIDashboard |
| REST API | Quản lý user, ngưỡng, dữ liệu lịch sử | UIDashboard, Server API |

---

## 6. Component chính

| Component | Chức năng |
|------------|-----------|
| SensorControl | Đọc và publish dữ liệu cảm biến |
| DataCollector | Lưu dữ liệu từ MQTT vào DB |
| IrrigationManager | Điều khiển tự động thiết bị |
| CloudBrokerService | Quản lý MQTT, WS, REST API |
| UIDashboard | Hiển thị và điều khiển thiết bị |
| Database | Lưu trữ dữ liệu người dùng và cảm biến |

---

## 7. Lớp (Class) đề xuất

| Class | Thuộc tính chính | Phương thức | Status |
|-------|------------------|-------------|--------|
| Sensor | sensorId, type, value, timestamp | readData(), sendData() | ✅ |
| Actuator | actuatorId, type, status | receiveCommand(), execute() | ✅ |
| Threshold | name, sensorType, minValue, maxValue, action | updateThreshold(), checkLimit(), isViolated() | ✅ |
| Alert | type, severity, message, status, notifications | acknowledge(), resolve(), dismiss() | ✅ |
| DataCollector | dbConnection | saveData(), getData(), getHistory() | ✅ |
| IrrigationManager | threshold, sensorData | evaluate(), sendCommand() | ✅ (AutomationService) |
| BrokerService | mqttClient, wsClient | connect(), publish(), subscribe() | ✅ |
| User | userId, username, password, role | login(), logout(), updateInfo() | ✅ |
| Role | name, permissions | hasPermission() | ✅ |
| DashboardController | dataCollector, irrigationManager | displayData(), controlDevice() | ⏳ |
| DatabaseManager | connectionString | insert(), select(), update() | ✅ (Mongoose) |
| NotificationService | alertingClients | sendEmail(), sendSMS(), sendPush() | ✅ |

---

## 8. Flow / Sequence Logic

### 8.1 Đọc dữ liệu cảm biến (MQTT)
Sensor → BrokerService → DataCollector → DatabaseManager → UIDashboard

- Dữ liệu được gửi lên topic MQTT.
- Collector nhận, lưu vào DB và cập nhật dashboard.

### 8.2 Điều khiển tự động
DataCollector → IrrigationManager → Threshold → IrrigationManager → BrokerService → Actuator


### 8.3 Điều khiển thủ công


Farmer → UIDashboard → BrokerService → Actuator


### 8.4 Xem dữ liệu lịch sử


Farmer → UIDashboard → DataCollector → DatabaseManager → UIDashboard


---

## 9. Kiến trúc tầng (Layered Architecture)

| Tầng | Vai trò |
|------|----------|
| Boundary | DashboardUI, APIController – giao diện & API |
| Control | Điều phối logic giữa UI và Business |
| Business Logic | Xử lý tự động, quyết định, cảnh báo |
| Entity | Dữ liệu chính (sensor, actuator, user, log) |
| Service / Integration | Kết nối MQTT, REST, WS, Database |

---

## 10. Nhóm lớp theo tầng

### 🔹 Boundary
`{DashboardUI, MobileAppUI, APIController, AdminPortal}`

### 🔹 Control
`{SensorController, ActuatorController, DataController, UserController, ThresholdController, LogController}`

### 🔹 Business Logic
`{IrrigationManager, RuleEngine, ThresholdManager, NotificationManager, UserManager, ReportGenerator}`

### 🔹 Entity
`{Sensor, Actuator, FarmZone, Threshold, User, Role, SensorData, ActionLog, BrokerConfig}`

### 🔹 Service / Integration
`{MQTTService, WebSocketService, RESTService, DatabaseService, LogService, CloudSyncService}`

---

## 11. Swimlane Use Cases

### 11.1 Quan sát dữ liệu & điều khiển thiết bị (Monitoring & Control)
**Actor:** Farmer, Technician  
**Mục tiêu:** Quan sát dữ liệu và bật/tắt thiết bị.  
**Luồng chính:**  
1. User mở Dashboard  
2. Dashboard lấy dữ liệu từ `DataController`  
3. Nếu user điều khiển → gọi `ActuatorController` → gửi MQTT lệnh tới thiết bị  
4. Thiết bị phản hồi trạng thái → cập nhật lại dashboard

---

### 11.2 Tự động tưới nước (Auto Irrigation)
**Actor:** System  
**Luồng chính:**
1. Sensor đọc dữ liệu mỗi 30s → gửi MQTT  
2. DataCollector lưu DB → chuyển cho `IrrigationManager`  
3. `IrrigationManager` so sánh với `ThresholdManager`  
4. Nếu vượt ngưỡng → publish MQTT lệnh điều khiển  
5. Dashboard cập nhật real-time trạng thái thiết bị

---

### 11.3 Quản lý người dùng & phân quyền (Role Management)
**Actor:** Admin, Farm Owner  
**Luồng chính:**
1. Admin mở Portal → “User Management”  
2. Gửi request đến `UserController`  
3. `UserController` gọi `UserManager` & `RoleManager`  
4. Lưu DB → ghi log hoạt động

---

## 12. UI Flow (Dashboard & App)

### Dashboard (Farmer / Technician)


Login → Dashboard → [Sensor | Device | History | Threshold]

- Cập nhật threshold → hiển thị dialog xác nhận  
- Điều khiển thiết bị → log lại hành động  
- Xem lịch sử → gọi REST API tải dữ liệu

### Admin Portal


Login → Admin Dashboard → [User | Role | Broker | Logs]


### Mobile App


Login → Home → [Sensor Data | Device Control] → Alert → Back


---

## 13. UML & Diagram Gợi ý
- **Use Case Diagram:** UC01–UC14  
- **Class Diagram:** Các lớp ở mục 7  
- **Sequence Diagram:** MQTT, Auto Control, Manual Control  
- **Component Diagram:** 6 thành phần chính  
- **Activity Diagram:** Quy trình điều khiển tự động  
- **Communication Diagram:** Sensor ↔ Broker ↔ Dashboard

---

## 14. Pattern & Architecture
- **Service Broker Pattern**  
- **Layered MVC Architecture**  
- **Event-driven IoT Communication (MQTT + WS)**  
- **Cloud-first Design**  

---

## 15. Implementation Status & API Endpoints

### ✅ Implemented Features

#### Authentication & User Management (UC01, UC06, UC07)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login with JWT
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

#### Device Control (UC03, UC12)
- `POST /api/devices/control` - Manual device control
- Device status tracking via MQTT

#### Threshold Management (UC05)
- `POST /api/thresholds` - Create new threshold
- `GET /api/thresholds` - Get all thresholds (with filters)
- `GET /api/thresholds/:id` - Get threshold by ID
- `PUT /api/thresholds/:id` - Update threshold
- `DELETE /api/thresholds/:id` - Delete threshold
- `PATCH /api/thresholds/:id/toggle` - Activate/deactivate threshold
- `GET /api/thresholds/stats` - Get threshold statistics

#### Automation (UC04)
- Automatic evaluation of sensor data against thresholds
- Auto-trigger device control when threshold exceeded
- Event-driven architecture with EventBus

#### Alert & Notification (UC09)
- `GET /api/alerts` - Get all alerts (with pagination & filters)
- `GET /api/alerts/active` - Get active alerts
- `GET /api/alerts/stats` - Get alert statistics
- `POST /api/alerts/:id/acknowledge` - Acknowledge alert
- `POST /api/alerts/:id/resolve` - Resolve alert
- `POST /api/alerts/test-notification` - Test notification channels
- Email notifications (via NodeMailer)
- SMS notifications (Mock - requires Twilio)
- Push notifications (Mock - requires Firebase FCM)

#### Data Ingestion (UC08)
- MQTT sensor data collection
- Real-time data storage to MongoDB
- Event emission for real-time updates

#### Demo & Documentation
- `GET /api/demo/architecture-flow` - Architecture documentation
- `POST /api/demo/test-flow` - Test use case flows

### ⏳ Planned Features

#### Dashboard (UC02)
- `GET /api/dashboard/summary` - Dashboard summary
- `GET /api/dashboard/sensors/:type` - Sensor data by type
- `GET /api/dashboard/devices` - Device status overview

#### Reports (UC08)
- `GET /api/reports/sensor-data` - Historical sensor data reports
- `GET /api/reports/device-usage` - Device usage reports
- `GET /api/reports/alerts-summary` - Alerts summary reports

#### Incident Management (UC13)
- `POST /api/incidents` - Report device incident
- `GET /api/incidents` - Get all incidents
- `PUT /api/incidents/:id` - Update incident status

#### Advanced Features
- Multi-tenancy support
- Advanced analytics
- Data backup & restore (UC14)
- gRPC inter-service communication

---

## 16. Architecture Patterns Implemented

### ✅ Component-Based Architecture
- 5 main components: User Management, Data Ingestion, Device Control, Automation Engine, Monitoring & Logging
- Each component follows Clean Architecture with 4 layers

### ✅ Event-Driven Architecture
- EventBus for asynchronous communication between components
- 15+ event types for loose coupling

### ✅ Repository Pattern
- Data access abstraction layer
- Repositories: UserRepository, RoleRepository, ThresholdRepository, AlertRepository, etc.

### ✅ Service Layer Pattern
- Business logic in Application Services
- Services: AuthService, UserService, ThresholdService, AutomationService, NotificationService

### ✅ Gateway Pattern
- API Gateway for REST endpoints
- WebSocket Gateway for real-time communication
- MQTT Gateway for IoT devices

---

## 17. Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Runtime | Node.js v20+ | JavaScript runtime |
| Framework | Express.js | Web framework |
| Database | MongoDB + Mongoose | NoSQL database & ODM |
| Message Broker | MQTT (mqtt.js) | IoT device communication |
| Event Bus | EventEmitter | In-memory pub/sub |
| WebSocket | Socket.IO | Real-time bidirectional communication |
| Authentication | JWT (jsonwebtoken) | Stateless auth |
| Password | bcryptjs | Password hashing |
| Email | NodeMailer | Email notifications |
| Logging | Winston | Application logging |
| Validation | Joi | Input validation |
| Environment | dotenv | Environment variables |

---

## 18. Quick Start Guide

### Prerequisites
- Node.js v20+
- MongoDB (optional - can run in demo mode)
- MQTT Broker (optional - can run in demo mode)

### Installation
```bash
# Clone repository
git clone <repository-url>
cd SWD392

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env file

# Start server
npm start
```

### Configuration
Edit `.env` file:
```env
# Server
PORT=3000
NODE_ENV=development

# Database (set to false for demo mode)
ENABLE_DATABASE=false
MONGODB_URI=mongodb://localhost:27017/smart_agriculture

# MQTT (set to false for demo mode)
ENABLE_MQTT=false
MQTT_BROKER_URL=mqtt://localhost:1883

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=24h

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### API Testing
```bash
# Health check
curl http://localhost:3000/health

# View architecture
curl http://localhost:3000/api/demo/architecture-flow

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@example.com","password":"123456"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"123456"}'

# Create threshold
curl -X POST http://localhost:3000/api/thresholds \
  -H "Content-Type: application/json" \
  -d '{
    "name":"High Temperature Alert",
    "sensorType":"temperature",
    "minValue":10,
    "maxValue":35,
    "action":{
      "type":"both",
      "deviceId":"fan-01",
      "deviceAction":"on",
      "alertType":"email",
      "recipients":["admin@example.com"]
    }
  }'
```

---

© 2025 Smart Agriculture System - SWD392