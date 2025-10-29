# 🏗️ Kiến trúc Component-Based - Smart Agriculture System

> **Architecture Pattern**: Clean Architecture / Hexagonal Architecture  
> **Communication Style**: Event-Driven Architecture + REST API  
> **Database**: MongoDB (NoSQL) + Time-Series DB (cho sensor data)  
> **Message Broker**: MQTT (IoT devices) + Event Bus (inter-component communication)

---

## 📋 Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Cấu trúc thư mục chi tiết](#2-cấu-trúc-thư-mục-chi-tiết)
3. [Layer Architecture](#3-layer-architecture)
4. [Components và Use Cases](#4-components-và-use-cases)
5. [Luồng dữ liệu](#5-luồng-dữ-liệu)
6. [Event-Driven Communication](#6-event-driven-communication)
7. [API Endpoints](#7-api-endpoints)
8. [Cách chạy project](#8-cách-chạy-project)

---

## 1️⃣ Tổng quan kiến trúc

### 🎯 Nguyên tắc thiết kế

- **Separation of Concerns**: Mỗi component độc lập, có trách nhiệm riêng
- **Dependency Inversion**: Business logic không phụ thuộc vào infrastructure
- **Single Responsibility**: Mỗi class/module chỉ làm một việc
- **Loose Coupling**: Components giao tiếp qua Events, không phụ thuộc trực tiếp
- **High Cohesion**: Code liên quan được gom trong cùng một component

### 🏛️ Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
│  (Web Dashboard, Mobile App, IoT Devices)                   │
└────────────────┬─────────────────────┬──────────────────────┘
                 │                     │
        ┌────────▼────────┐   ┌───────▼────────┐
        │  API Gateway    │   │  WebSocket     │
        │  (REST API)     │   │  Gateway       │
        └────────┬────────┘   └───────┬────────┘
                 │                     │
┌────────────────┴─────────────────────┴──────────────────────┐
│                   COMPONENT LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │User          │  │Data          │  │Device        │      │
│  │Management    │  │Ingestion     │  │Control       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │Automation    │  │Monitoring    │                        │
│  │Engine        │  │& Logging     │                        │
│  └──────────────┘  └──────────────┘                        │
└────────────────────────┬─────────────────────────────────────┘
                         │
        ┌────────────────▼────────────────┐
        │       SHARED KERNEL             │
        │  (Config, Logger, EventBus)     │
        └────────────────┬────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────┐
│              INFRASTRUCTURE LAYER                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ MongoDB  │  │  MQTT    │  │  Email   │  │  SMS     │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## 2️⃣ Cấu trúc thư mục chi tiết

```
/smart-agriculture-system
│
├── /src                         # Entry point của ứng dụng
│   └── index.js                 # Main file khởi động hệ thống
│
├── /components                  # 🎯 Core Business Components
│   │
│   ├── /user-management         # 👤 UC01, UC06, UC07: Quản lý người dùng & phân quyền
│   │   ├── /presentation        # HTTP Controllers (REST API)
│   │   │   ├── AuthController.js         # POST /api/auth/login, /register
│   │   │   ├── UserController.js         # CRUD /api/users
│   │   │   ├── RoleController.js         # CRUD /api/roles (chưa implement)
│   │   │   └── DemoController.js         # Demo architecture flow
│   │   │
│   │   ├── /application         # Business Logic Layer
│   │   │   ├── AuthService.js            # Login, Register, JWT generation
│   │   │   ├── UserService.js            # User CRUD operations
│   │   │   └── RoleService.js            # Role & Permission management
│   │   │
│   │   ├── /domain              # Core Business Entities
│   │   │   ├── User.js                   # User entity với Mongoose schema
│   │   │   │   • username, email, password (hashed)
│   │   │   │   • role (reference to Role)
│   │   │   │   • validatePassword(), hashPassword()
│   │   │   │
│   │   │   └── Role.js                   # Role entity
│   │   │       • name (admin, farmer, manager)
│   │   │       • permissions[]
│   │   │
│   │   └── /infrastructure      # Data Access & External Services
│   │       ├── UserRepository.js         # MongoDB operations cho User
│   │       └── RoleRepository.js         # MongoDB operations cho Role
│   │
│   ├── /data-ingestion          # 📊 UC08: Thu thập dữ liệu từ sensors
│   │   ├── /application
│   │   │   └── DataCollectorService.js   # Parse sensor data, emit events
│   │   │       • handleSensorData()
│   │   │       • validateData()
│   │   │       • Emit: "sensor.data.received"
│   │   │
│   │   ├── /domain
│   │   │   └── SensorData.js             # SensorData entity
│   │   │       • sensorId, sensorType
│   │   │       • value, unit, timestamp
│   │   │       • location (farmId, zoneId)
│   │   │
│   │   └── /infrastructure
│   │       ├── MqttHandler.js            # Subscribe MQTT topics
│   │       │   • Subscribe: "sensors/+/data"
│   │       │   • On message → call DataCollectorService
│   │       │
│   │       └── SensorDataRepository.js   # Save to TimeSeries DB
│   │
│   ├── /device-control          # 🎮 UC03: Điều khiển thiết bị (pump, fan, valve)
│   │   ├── /presentation
│   │   │   └── DeviceController.js       # POST /api/devices/control
│   │   │
│   │   ├── /application
│   │   │   └── ActuatorService.js        # Control logic
│   │   │       • controlDevice(deviceId, action)
│   │   │       • validateCommand()
│   │   │       • Emit: "device.controlled"
│   │   │
│   │   ├── /domain
│   │   │   └── Actuator.js               # Device entity
│   │   │       • deviceId, deviceType
│   │   │       • status (on/off), mode (auto/manual)
│   │   │       • location
│   │   │
│   │   └── /infrastructure
│   │       ├── MqttPublishService.js     # Publish to MQTT
│   │       │   • Publish: "devices/{id}/control"
│   │       │
│   │       └── ActuatorRepository.js     # Save device state
│   │
│   ├── /automation-engine       # 🤖 UC04, UC05, UC09: Tự động hóa & Alerts
│   │   ├── /presentation
│   │   │   └── ThresholdController.js    # CRUD /api/thresholds (chưa implement)
│   │   │
│   │   ├── /application
│   │   │   ├── AutomationService.js      # Listen "sensor.data.received"
│   │   │   │   • compareWithThreshold()
│   │   │   │   • triggerAutomation()
│   │   │   │   • Emit: "threshold.exceeded"
│   │   │   │
│   │   │   ├── ThresholdService.js       # CRUD thresholds (chưa implement)
│   │   │   │
│   │   │   └── NotificationService.js    # Listen "threshold.exceeded"
│   │   │       • createAlert()
│   │   │       • sendNotification()
│   │   │       • Emit: "alert.created"
│   │   │
│   │   ├── /domain
│   │   │   ├── Threshold.js              # Threshold entity (chưa implement)
│   │   │   └── Alert.js                  # Alert entity (chưa implement)
│   │   │
│   │   └── /infrastructure
│   │       ├── ThresholdRepository.js    # (chưa implement)
│   │       └── AlertingClients.js        # Email, SMS, Push (chưa implement)
│   │
│   └── /monitoring-logging      # 📈 UC02, UC12, UC13: Dashboard, Reports, Incidents
│       ├── /presentation
│       │   ├── DashboardController.js    # GET /api/dashboard (chưa implement)
│       │   └── IncidentController.js     # POST /api/incidents (chưa implement)
│       │
│       ├── /application
│       │   ├── MonitoringService.js      # Aggregate data cho dashboard
│       │   ├── IncidentService.js        # Handle incident reports
│       │   └── LogService.js             # System logging
│       │
│       ├── /domain
│       │   └── IncidentReport.js         # (chưa implement)
│       │
│       └── /infrastructure
│           ├── SensorDataRepository.js   # Query time-series data
│           └── IncidentRepository.js     # (chưa implement)
│
├── /gateways                    # 🚪 Entry Points
│   │
│   ├── /api-gateway
│   │   └── index.js             # ✅ API Gateway (Express app)
│   │       • Routing: /api/auth, /api/users, /api/devices
│   │       • Middleware: CORS, Body Parser, Morgan Logger
│   │       • Error Handling
│   │       • Health Check: GET /health
│   │
│   └── /websocket-gateway
│       └── index.js             # ✅ WebSocket Gateway (Socket.IO)
│           • Real-time updates
│           • Emit sensor data to clients
│           • Listen to event bus
│
├── /shared-kernel               # 🛠️ Shared Infrastructure
│   │
│   ├── /config
│   │   └── index.js             # ✅ Centralized configuration
│   │       • server: { port, env }
│   │       • database: { uri, enabled }
│   │       • mqtt: { brokerUrl, enabled, topics }
│   │       • jwt: { secret, expiresIn }
│   │       • email, websocket, alerts, logging
│   │
│   ├── /database
│   │   └── index.js             # ✅ MongoDB connection manager
│   │       • connectDB()
│   │       • disconnectDB()
│   │       • Mongoose instance
│   │
│   ├── /event-bus
│   │   └── index.js             # ✅ In-memory Event Bus (EventEmitter)
│   │       • Events:
│   │         - sensor.data.received
│   │         - device.controlled
│   │         - threshold.exceeded
│   │         - alert.created
│   │       • emit(event, data)
│   │       • on(event, handler)
│   │
│   └── /utils
│       ├── logger.js            # ✅ Winston logger
│       │   • Console transport
│       │   • File transport (logs/combined.log, logs/error.log)
│       │
│       ├── response.js          # ✅ Standardized API responses
│       │   • successResponse()
│       │   • errorResponse()
│       │
│       └── validator.js         # ✅ Input validation helpers
│           • validateEmail()
│           • validatePassword()
│           • sanitize()
│
├── /logs                        # 📝 Log files
│   ├── combined.log             # All logs
│   └── error.log                # Error logs only
│
├── package.json                 # Dependencies & scripts
├── .env                         # Environment variables
└── README.md                    # Project documentation
```

---

## 3️⃣ Layer Architecture

Mỗi component được tổ chức theo **4 tầng** (Clean Architecture):

### 🎨 1. Presentation Layer (Controllers)
- **Trách nhiệm**: Xử lý HTTP requests/responses
- **Input**: HTTP Request (từ API Gateway)
- **Output**: HTTP Response (JSON)
- **Không chứa**: Business logic
- **Ví dụ**: `AuthController.js`, `UserController.js`, `DeviceController.js`

```javascript
// Presentation Layer Example
class AuthController {
  async login(req, res) {
    // 1. Extract data from request
    const { email, password } = req.body;
    
    // 2. Call Application Service
    const result = await authService.login(email, password);
    
    // 3. Return response
    return successResponse(res, result);
  }
}
```

### 💼 2. Application Layer (Services)
- **Trách nhiệm**: Orchestrate business logic, use cases
- **Input**: Data từ Presentation Layer
- **Output**: Data hoặc Events
- **Gọi**: Domain Layer (entities) và Infrastructure Layer (repositories)
- **Ví dụ**: `AuthService.js`, `UserService.js`, `DataCollectorService.js`

```javascript
// Application Layer Example
class AuthService {
  async login(email, password) {
    // 1. Get user from repository (Infrastructure)
    const user = await userRepository.findByEmail(email);
    
    // 2. Validate password (Domain logic)
    const isValid = await user.validatePassword(password);
    
    // 3. Generate JWT token
    const token = jwt.sign({ userId: user._id }, config.jwt.secret);
    
    // 4. Return result
    return { user, token };
  }
}
```

### 🏢 3. Domain Layer (Entities)
- **Trách nhiệm**: Core business entities và business rules
- **Chứa**: Data models, validation logic, business methods
- **Không phụ thuộc**: Infrastructure (DB, external services)
- **Ví dụ**: `User.js`, `Role.js`, `SensorData.js`, `Actuator.js`

```javascript
// Domain Layer Example (Mongoose Schema)
const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' }
});

// Business logic trong Domain
UserSchema.methods.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};
```

### 🔌 4. Infrastructure Layer (Repositories)
- **Trách nhiệm**: Tương tác với external systems
- **Bao gồm**: Database operations, MQTT, Email, SMS, APIs
- **Ví dụ**: `UserRepository.js`, `MqttHandler.js`, `AlertingClients.js`

```javascript
// Infrastructure Layer Example
class UserRepository {
  async findByEmail(email) {
    return await User.findOne({ email }).populate('role');
  }
  
  async create(userData) {
    const user = new User(userData);
    return await user.save();
  }
}
```

---

## 4️⃣ Components và Use Cases

### 👤 User Management
| Use Case | Endpoint | Method | Controller | Service | Status |
|----------|----------|--------|------------|---------|--------|
| UC01: Login | `/api/auth/login` | POST | AuthController | AuthService | ✅ Implemented |
| UC01: Register | `/api/auth/register` | POST | AuthController | AuthService | ✅ Implemented |
| UC06: List Users | `/api/users` | GET | UserController | UserService | ✅ Implemented |
| UC06: Create User | `/api/users` | POST | UserController | UserService | ✅ Implemented |
| UC06: Update User | `/api/users/:id` | PUT | UserController | UserService | ✅ Implemented |
| UC06: Delete User | `/api/users/:id` | DELETE | UserController | UserService | ✅ Implemented |
| UC07: Manage Roles | `/api/roles` | ALL | RoleController | RoleService | ⏳ Planned |

### 📊 Data Ingestion
| Use Case | Event/Topic | Handler | Status |
|----------|-------------|---------|--------|
| UC08: Collect Sensor Data | MQTT: `sensors/+/data` | MqttHandler → DataCollectorService | ✅ Implemented |

### 🎮 Device Control
| Use Case | Endpoint | Method | Controller | Service | Status |
|----------|----------|--------|------------|---------|--------|
| UC03: Control Device | `/api/devices/control` | POST | DeviceController | ActuatorService | ✅ Implemented |

### 🤖 Automation Engine
| Use Case | Event Flow | Status |
|----------|------------|--------|
| UC04: Auto Control | Listen `sensor.data.received` → Compare threshold → Emit `threshold.exceeded` | ⏳ Planned |
| UC05: Manage Thresholds | CRUD `/api/thresholds` | ⏳ Planned |
| UC09: Send Alerts | Listen `threshold.exceeded` → Send Email/SMS → Emit `alert.created` | ⏳ Planned |

### 📈 Monitoring & Logging
| Use Case | Endpoint | Status |
|----------|----------|--------|
| UC02: Dashboard | `/api/dashboard` | ⏳ Planned |
| UC12: Reports | `/api/reports` | ⏳ Planned |
| UC13: Incident Reports | `/api/incidents` | ⏳ Planned |

---

## 5️⃣ Luồng dữ liệu

### 📱 Use Case: Login (UC01)

```
1. CLIENT
   │ POST /api/auth/login
   │ { email, password }
   ▼
2. API GATEWAY
   │ Route to AuthController
   ▼
3. PRESENTATION LAYER
   │ AuthController.login()
   │ Extract req.body
   ▼
4. APPLICATION LAYER
   │ AuthService.login(email, password)
   │ • Call UserRepository.findByEmail()
   │ • Call user.validatePassword()
   │ • Generate JWT token
   ▼
5. DOMAIN LAYER
   │ User.validatePassword()
   │ • bcrypt.compare()
   ▼
6. INFRASTRUCTURE LAYER
   │ UserRepository.findByEmail()
   │ • MongoDB query
   │ • User.findOne({ email })
   ▼
7. RESPONSE
   │ { success: true, token, user }
   └─► CLIENT
```

### 🌡️ Use Case: Sensor Data Flow (UC08)

```
1. IoT DEVICE
   │ Publish MQTT message
   │ Topic: "sensors/temp-01/data"
   │ Payload: { temperature: 28.5, humidity: 65 }
   ▼
2. MQTT BROKER
   │ Forward to subscribers
   ▼
3. INFRASTRUCTURE LAYER
   │ MqttHandler.handleMessage()
   │ Parse message
   ▼
4. APPLICATION LAYER
   │ DataCollectorService.handleSensorData()
   │ • Validate data
   │ • Save to DB
   │ • Emit event "sensor.data.received"
   ▼
5. EVENT BUS
   │ Broadcast event
   ├─► AutomationService (listen)
   │   • Compare with threshold
   │   • Trigger automation if needed
   │
   ├─► MonitoringService (listen)
   │   • Update dashboard
   │   • Store time-series data
   │
   └─► WebSocket Gateway (listen)
       • Push to connected clients
       • Real-time update
```

---

## 6️⃣ Event-Driven Communication

### 📢 Event Bus (In-memory)

Các components giao tiếp với nhau qua **Event Bus** (Pub/Sub pattern):

```javascript
// shared-kernel/event-bus/index.js
const EventEmitter = require('events');
const eventBus = new EventEmitter();

// Define events
const Events = {
  SENSOR_DATA_RECEIVED: 'sensor.data.received',
  DEVICE_CONTROLLED: 'device.controlled',
  THRESHOLD_EXCEEDED: 'threshold.exceeded',
  ALERT_CREATED: 'alert.created'
};
```

### 🔊 Publishers (Emit Events)

| Component | Event | When |
|-----------|-------|------|
| DataCollectorService | `sensor.data.received` | Sau khi lưu sensor data |
| ActuatorService | `device.controlled` | Sau khi control device |
| AutomationService | `threshold.exceeded` | Khi vượt ngưỡng |
| NotificationService | `alert.created` | Sau khi tạo alert |

### 👂 Subscribers (Listen Events)

| Component | Listen To | Action |
|-----------|-----------|--------|
| AutomationService | `sensor.data.received` | So sánh với threshold |
| NotificationService | `threshold.exceeded` | Gửi alert |
| MonitoringService | `sensor.data.received`, `device.controlled`, `alert.created` | Update dashboard |
| WebSocket Gateway | All events | Push to clients |

### 📝 Event Flow Example

```javascript
// Publisher: DataCollectorService
async handleSensorData(data) {
  await sensorDataRepository.save(data);
  eventBus.emit(Events.SENSOR_DATA_RECEIVED, data);
}

// Subscriber: AutomationService
eventBus.on(Events.SENSOR_DATA_RECEIVED, async (data) => {
  const threshold = await thresholdService.getThreshold(data.sensorId);
  if (data.value > threshold.max || data.value < threshold.min) {
    eventBus.emit(Events.THRESHOLD_EXCEEDED, { data, threshold });
  }
});

// Subscriber: NotificationService
eventBus.on(Events.THRESHOLD_EXCEEDED, async ({ data, threshold }) => {
  await this.sendAlert(data, threshold);
  eventBus.emit(Events.ALERT_CREATED, { data, threshold });
});
```

---

## 7️⃣ API Endpoints

### 🔐 Authentication

| Method | Endpoint | Description | Body | Response |
|--------|----------|-------------|------|----------|
| POST | `/api/auth/register` | Đăng ký tài khoản | `{ username, email, password, role }` | `{ user, token }` |
| POST | `/api/auth/login` | Đăng nhập | `{ email, password }` | `{ user, token }` |

### 👥 Users

| Method | Endpoint | Description | Auth | Response |
|--------|----------|-------------|------|----------|
| GET | `/api/users` | Lấy danh sách users | ✅ Required | `{ users[] }` |
| GET | `/api/users/:id` | Lấy user theo ID | ✅ Required | `{ user }` |
| POST | `/api/users` | Tạo user mới | ✅ Admin only | `{ user }` |
| PUT | `/api/users/:id` | Cập nhật user | ✅ Admin only | `{ user }` |
| DELETE | `/api/users/:id` | Xóa user | ✅ Admin only | `{ message }` |

### 🎮 Devices

| Method | Endpoint | Description | Body | Response |
|--------|----------|-------------|------|----------|
| POST | `/api/devices/control` | Điều khiển thiết bị | `{ deviceId, action }` | `{ device, status }` |

### 🎯 Demo Architecture

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/api/demo/architecture-flow` | Xem luồng chạy kiến trúc | Full architecture documentation |
| POST | `/api/demo/test-flow` | Test use case flow | `{ useCase: "UC01" }` |

### 🏥 Health Check

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/health` | Kiểm tra status hệ thống | `{ status, timestamp, uptime }` |

---

## 8️⃣ Cách chạy project

### 📦 1. Install Dependencies

```bash
npm install
```

### ⚙️ 2. Configure Environment

Tạo file `.env`:

```env
# Server
PORT=3000
NODE_ENV=development

# Database (disable for demo mode)
ENABLE_DATABASE=false
MONGODB_URI=mongodb://localhost:27017/smart_agriculture

# MQTT (disable for demo mode)
ENABLE_MQTT=false
MQTT_BROKER_URL=mqtt://localhost:1883

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=24h
```

### 🚀 3. Start Server

```bash
npm start
```

Server sẽ chạy tại: `http://localhost:3000`

### 🧪 4. Test API

**Health Check:**
```bash
curl http://localhost:3000/health
```

**Architecture Flow:**
```bash
curl http://localhost:3000/api/demo/architecture-flow
```

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@example.com","password":"123456","role":"admin"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"123456"}'
```

### 🔧 5. Enable MongoDB & MQTT

Khi cần kết nối MongoDB và MQTT, update `.env`:

```env
ENABLE_DATABASE=true
ENABLE_MQTT=true
```

Đảm bảo MongoDB và MQTT Broker đang chạy:

```bash
# MongoDB (Docker)
docker run -d -p 27017:27017 mongo

# MQTT Broker (Mosquitto)
docker run -d -p 1883:1883 eclipse-mosquitto
```

---

## 📚 Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js v20+ |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Message Broker | MQTT (mqtt.js) |
| Event Bus | Node EventEmitter |
| WebSocket | Socket.IO |
| Authentication | JWT (jsonwebtoken) |
| Password Hashing | bcryptjs |
| Logging | Winston |
| Validation | Custom validators |
| Environment | dotenv |

---

## 🎓 Best Practices

1. **Dependency Injection**: Pass dependencies qua constructor
2. **Single Responsibility**: Một file chỉ làm một việc
3. **Error Handling**: Centralized error handling trong API Gateway
4. **Logging**: Sử dụng Winston logger thống nhất
5. **Validation**: Validate input ở Presentation Layer
6. **Async/Await**: Sử dụng async/await thay vì callbacks
7. **Environment Variables**: Không hardcode credentials
8. **Event-Driven**: Components giao tiếp qua events, không gọi trực tiếp

---

## 🚧 TODO / Roadmap

- [ ] Implement Automation Engine (UC04, UC05)
- [ ] Implement Notification Service (UC09)
- [ ] Implement Monitoring Dashboard (UC02)
- [ ] Implement Reports (UC12)
- [ ] Implement Incident Management (UC13)
- [ ] Add API documentation (Swagger)
- [ ] Add unit tests (Jest)
- [ ] Add integration tests
- [ ] Add Docker support
- [ ] Add CI/CD pipeline

---

## 📞 Contact & Support

Để biết thêm chi tiết, xem:
- `README.md` - Project overview
- `/components/*/README.md` - Component-specific docs
- API Demo: `GET /api/demo/architecture-flow`

**Made with ❤️ for Smart Agriculture**
