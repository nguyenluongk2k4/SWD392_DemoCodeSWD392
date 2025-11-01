# 📊 Database ERD - Smart Agriculture System

## 🗂️ Collections Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE COLLECTIONS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  6 Main Collections: users, roles, sensordatas, actuators, thresholds, alerts │
│  Time Series: sensordatas (MongoDB Time Series Collection)                 │
│  Relationships: 12 foreign key relationships                               │
│  Indexes: 15+ optimized indexes                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🔗 Entity Relationship Diagram

```
                    ┌─────────────┐
                    │    User     │
                    │             │
                    │ • username  │
                    │ • email     │
                    │ • role ─────┼─────┐
                    │ • isActive  │     │
                    └─────────────┘     │
                           │            │
                           │            │
                           ▼            │
                    ┌─────────────┐     │
                    │    Role     │     │
                    │             │     │
                    │ • name      │     │
                    │ • permissions│    │
                    └─────────────┘     │
                                        │
                                        │
┌─────────────┐           ┌─────────────┐ │
│ SensorData  │◄──────────┤ Threshold   │ │
│ (TimeSeries)│           │             │ │
│             │           │ • sensorType│ │
│ • sensorId  │           │ • min/max   │ │
│ • value     │           │ • action    │ │
│ • timestamp │           └─────────────┘ │
└─────────────┘                  │        │
                                 │        │
                                 ▼        │
                    ┌─────────────┐        │
                    │   Alert     │        │
                    │             │        │
                    │ • type      │        │
                    │ • severity  │        │
                    │ • status    │        │
                    │ • threshold ┼────────┘
                    │ • device ───┼─────────────┐
                    └─────────────┘             │
                           ▲                    │
                           │                    │
                           │                    │
                    ┌─────────────┐             │
                    │  Actuator   │             │
                    │             │             │
                    │ • deviceId  │             │
                    │ • type      │             │
                    │ • status    │             │
                    │ • location  │             │
                    └─────────────┘             │
                                                │
                                                │
                                                │
                    ┌─────────────┐             │
                    │    User     │◄────────────┘
                    │ (same as above)           │
                    └─────────────┘
```

## 📋 Key Relationships

### One-to-Many:
- **User → Role**: Many users share same role
- **User → Threshold**: Users create/manage thresholds
- **User → Alert**: Users acknowledge/resolve alerts
- **Threshold → Alert**: One threshold → multiple alerts
- **Actuator → Alert**: One device → multiple alerts

### Many-to-One:
- **Alert → Threshold**: Each alert links to one threshold
- **Alert → Actuator**: Each alert links to one device
- **Alert → User**: Alerts acknowledged/resolved by users

### Time Series Links:
- **SensorData ↔ Alert**: Alerts store sensor data snapshots
- **SensorData ↔ Threshold**: Thresholds apply to sensor types

## 🔑 Primary Keys & Foreign Keys

| Collection | Primary Key | Foreign Keys |
|------------|-------------|--------------|
| users | _id | role → roles._id |
| roles | _id | - |
| sensordatas | _id | - |
| actuators | _id | - |
| thresholds | _id | createdBy → users._id<br>updatedBy → users._id |
| alerts | _id | threshold → thresholds._id<br>device → actuators._id<br>acknowledgedBy → users._id<br>resolvedBy → users._id |

## 📊 Data Flow

### Sensor Data Ingestion:
```
IoT Sensor → MQTT → DataCollector → SensorData Collection
                                      ↓
                               Threshold Evaluation
                                      ↓
                            Alert Creation / Device Control
```

### User Actions:
```
User Login → JWT Token → API Access → CRUD Operations
                                      ↓
                               Database Updates → Event Emission
                                      ↓
                            Real-time UI Updates
```

### Automation Flow:
```
SensorData → Threshold Check → Violation Detected
                                      ↓
                            Device Control + Alert Creation
                                      ↓
                         Notification Service → Email/SMS
```

## 🏗️ Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│  REST APIs: /api/users, /api/thresholds, /api/alerts        │
│  Controllers: UserController, ThresholdController, etc.     │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   APPLICATION LAYER                         │
│  Services: AuthService, ThresholdService, AutomationService │
│  Business Logic: Validation, Orchestration, Events          │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   DOMAIN LAYER                              │
│  Entities: User, Role, SensorData, Actuator, Threshold, Alert│
│  Business Rules: Password hashing, threshold evaluation     │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 INFRASTRUCTURE LAYER                        │
│  Repositories: MongoDB operations, MQTT handlers            │
│  External Services: Email, SMS, WebSocket                   │
└─────────────────────────────────────────────────────────────┘
```

## 📈 Indexes & Performance

### Critical Indexes:
- **SensorData**: `{ sensorId: 1, timestamp: -1 }`, `{ sensorType: 1, timestamp: -1 }`
- **Alerts**: `{ type: 1, status: 1, createdAt: -1 }`, `{ severity: 1, status: 1 }`
- **Thresholds**: `{ sensorType: 1, isActive: 1 }`, `{ farmZone: 1, isActive: 1 }`

### Time Series Optimization:
- **Granularity**: minutes
- **Meta Field**: sensorId
- **Automatic Compression**: Enabled

## 🔒 Security & Constraints

### Authentication:
- JWT tokens for API access
- Role-based permissions
- Password hashing (bcrypt)

### Data Validation:
- Required fields enforcement
- Enum constraints
- Reference integrity
- Business rule validation

### Audit Trail:
- Created/updated timestamps
- User tracking for changes
- Alert acknowledgment logs

---

**ERD Design completed on:** October 31, 2025  
**Format:** Simplified ASCII diagram for clarity  
**Purpose:** Quick reference for database relationships</content>
<parameter name="filePath">e:\SWD392\DATABASE_ERD.md