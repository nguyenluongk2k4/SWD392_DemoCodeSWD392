# SWD392 Express.js Project

Dự án Express.js cơ bản với cấu trúc components based achitechtured

## 📋 Yêu cầu

- Node.js (v14 trở lên)
- npm hoặc yarn

## 🚀 Cài đặt

1. Cài đặt các dependencies:
```bash
npm install
```

2. Tạo file `.env` và cấu hình các biến môi trường (đã có sẵn)

3. Chạy server ở chế độ development:
```bash
npm run dev
```

hoặc chạy ở chế độ production:
```bash
npm start
```

Server sẽ chạy tại `http://localhost:3000`

## 📁 Cấu trúc thư mục

```
/smart-agriculture-system
|
├── /components                  # Các khối nghiệp vụ chính của hệ thống
|   |
|   ├── /data-ingestion          # Component nhận và xử lý dữ liệu cảm biến
|   |   ├── /application         # Logic nghiệp vụ (Use Cases)
|   |   |   └── DataCollectorService.js   # Xử lý dữ liệu nhận từ MQTT, parse, lưu DB, phát event
|   |   ├── /domain              # (Có thể không cần, dữ liệu đi qua trực tiếp)
|   |   ├── /infrastructure      # Kết nối bên ngoài
|   |   |   ├── MqttHandler.js             # Lắng nghe MQTT Broker, subscribe topic
|   |   |   └── SensorDataRepository.js   # Lưu dữ liệu vào time-series DB
|   |   └── /presentation        # (Thường không có, vì background service)
|   |
|   ├── /device-control          # Component điều khiển thiết bị (UC03)
|   |   ├── /application
|   |   |   └── ActuatorService.js        # Logic bật/tắt thiết bị, validate command
|   |   ├── /domain
|   |   |   └── Actuator.js                 # Entity: Pump, Fan, status
|   |   ├── /infrastructure
|   |   |   ├── MqttPublishService.js      # Gửi lệnh qua MQTT
|   |   |   └── ActuatorRepository.js      # Lưu trạng thái thiết bị
|   |   └── /presentation
|   |       └── DeviceController.js        # REST API (POST /api/control)
|   |
|   ├── /automation-engine       # Component xử lý logic tự động (UC04, UC05, UC09)
|   |   ├── /application
|   |   |   ├── AutomationService.js       # Logic chính UC04: so sánh dữ liệu vs threshold
|   |   |   ├── ThresholdService.js        # CRUD ngưỡng (UC05)
|   |   |   └── NotificationService.js     # Tạo và gửi alert (UC09)
|   |   ├── /domain
|   |   |   ├── Threshold.js               # Entity ngưỡng cảm biến
|   |   |   └── Alert.js                   # Entity cảnh báo
|   |   ├── /infrastructure
|   |   |   ├── ThresholdRepository.js
|   |   |   └── AlertingClients.js        # Email, SMS, Push Notification
|   |   └── /presentation
|   |       └── ThresholdController.js    # REST API (POST /api/thresholds)
|   |
|   ├── /user-management         # Component quản lý người dùng (UC01, UC06, UC07)
|   |   ├── /application
|   |   |   ├── AuthService.js           # Xử lý login (UC01), tạo JWT
|   |   |   ├── UserService.js           # CRUD user (UC06)
|   |   |   └── RoleService.js           # CRUD role & gán quyền (UC07)
|   |   ├── /domain
|   |   |   ├── User.js                  # Entity người dùng
|   |   |   └── Role.js                  # Entity vai trò
|   |   ├── /infrastructure
|   |   |   ├── UserRepository.js
|   |   |   └── RoleRepository.js
|   |   └── /presentation
|   |       ├── AuthController.js
|   |       ├── UserController.js
|   |       └── RoleController.js
|   |
|   └── /monitoring-logging      # Component giám sát, báo cáo (UC02, UC12, UC13)
|       ├── /application
|       |   ├── MonitoringService.js     # Cung cấp data dashboard UC02, UC12
|       |   ├── IncidentService.js       # Xử lý báo cáo sự cố UC13
|       |   └── LogService.js            # Ghi log hệ thống
|       ├── /domain
|       |   └── IncidentReport.js
|       ├── /infrastructure
|       |   ├── SensorDataRepository.js   # Có thể dùng chung từ data-ingestion
|       |   └── IncidentRepository.js
|       └── /presentation
|           ├── DashboardController.js  # API cho dashboard (UC02)
|           └── IncidentController.js   # API cho mobile-app (UC13)
|
├── /gateways                    # Cổng vào hệ thống
|   ├── /api-gateway             # Route request, xác thực, phân phối sang service
|   └── /websocket-gateway       # Cổng real-time: đẩy dữ liệu sensor / alert ra UI
|
└── /shared-kernel               # Thư viện dùng chung
    ├── /config                  # Cấu hình chung (env, constants)
    ├── /database                # Kết nối DB / ORM
    ├── /event-bus               # Event bus (RabbitMQ / Kafka) để giao tiếp bất đồng bộ
    └── /utils                   # Các hàm tiện ích (logger, helper)

```


## 🔧 Technologies

- **Express.js** - Web framework
- **dotenv** - Environment variables
- **cors** - Cross-Origin Resource Sharing
- **nodemon** - Auto-restart server (dev)

## 📄 License

ISC
