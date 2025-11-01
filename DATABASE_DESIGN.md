# 🗄️ Database Design - Smart Agriculture System

## 📋 Tổng quan Database

**Database Type**: MongoDB (NoSQL Document Database)  
**Time Series**: MongoDB Time Series Collections cho Sensor Data  
**ORM**: Mongoose ODM  
**Connection**: MongoDB Atlas hoặc Local MongoDB

---

## 📊 Collections Overview

| Collection | Purpose | Documents | Key Fields |
|------------|---------|-----------|------------|
| `users` | User management & authentication | User accounts | username, email, role |
| `roles` | Role-based permissions | User roles | name, permissions |
| `sensordatas` | IoT sensor readings | Time-series data | sensorId, sensorType, value, timestamp |
| `actuators` | Device control & status | IoT actuators | deviceId, type, status, location |
| `thresholds` | Automation rules | Threshold configurations | sensorType, minValue, maxValue, action |
| `alerts` | Alert & notification tracking | System alerts | type, severity, status, notifications |

---

## 🔗 Entity Relationship Diagram (ERD)

```
┌─────────────────┐       ┌─────────────────┐
│      User       │       │      Role       │
│                 │       │                 │
│ • _id           │◄──────┤ • _id           │
│ • username      │       │ • name          │
│ • email         │       │ • permissions[] │
│ • password      │       │ • description   │
│ • role (ref)    │       │                 │
│ • isActive      │       │                 │
│ • lastLogin     │       └─────────────────┘
│ • timestamps    │
└─────────────────┘
        │
        │ createdBy/updatedBy
        ▼
┌─────────────────┐       ┌─────────────────┐
│   Threshold     │       │     Alert       │
│                 │       │                 │
│ • _id           │──────►│ • _id           │
│ • name          │       │ • type          │
│ • sensorType    │       │ • severity      │
│ • minValue      │       │ • sensorData    │
│ • maxValue      │       │ • threshold(ref)│
│ • action        │       │ • device(ref)   │
│ • isActive      │       │ • status        │
│ • createdBy(ref)│       │ • notifications[]│
│ • timestamps    │       │ • timestamps    │
└─────────────────┘       └─────────────────┘
        ▲                       ▲
        │                       │
        │ sensorType             │ type/severity
        │                       │
┌─────────────────┐       ┌─────────────────┐
│  SensorData     │       │   Actuator      │
│  (Time Series)  │       │                 │
│                 │       │ • _id           │
│ • _id           │       │ • deviceId      │
│ • sensorId      │       │ • name          │
│ • sensorType    │       │ • type          │
│ • value         │       │ • status        │
│ • unit          │       │ • location      │
│ • location      │       │ • isAutomatic   │
│ • timestamp     │       │ • lastControlled│
│ • quality       │       │ • timestamps    │
│ • timestamps    │       └─────────────────┘
└─────────────────┘
```

---

## 📋 Detailed Schema Specifications

### 1. Users Collection

```javascript
{
  _id: ObjectId,
  username: String (required, unique, trim),
  email: String (required, unique, lowercase, trim),
  password: String (required, hashed),
  fullName: String (required),
  phoneNumber: String,
  role: ObjectId (ref: 'Role', required),
  isActive: Boolean (default: true),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ email: 1 }` (unique)
- `{ username: 1 }` (unique)
- `{ role: 1 }`

**Relationships:**
- `role` → `roles._id`

### 2. Roles Collection

```javascript
{
  _id: ObjectId,
  name: String (required, unique, enum: ['admin', 'manager', 'operator', 'viewer']),
  description: String,
  permissions: [String] (enum: ['view_dashboard', 'view_sensors', 'control_devices', ...]),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ name: 1 }` (unique)

**Relationships:**
- Referenced by `users.role`

### 3. SensorData Collection (Time Series)

```javascript
{
  _id: ObjectId,
  sensorId: String (required, indexed),
  sensorType: String (required, enum: ['temperature', 'humidity', 'soil_moisture', 'light', 'ph', 'nutrient']),
  value: Number (required),
  unit: String (required),
  location: {
    zone: String,
    field: String
  },
  timestamp: Date (default: now, indexed),
  quality: String (enum: ['good', 'warning', 'critical'], default: 'good'),
  createdAt: Date,
  updatedAt: Date
}
```

**Time Series Configuration:**
```javascript
{
  timeField: 'timestamp',
  metaField: 'sensorId',
  granularity: 'minutes'
}
```

**Indexes:**
- `{ sensorId: 1, timestamp: -1 }`
- `{ sensorType: 1, timestamp: -1 }`
- `{ "location.zone": 1, timestamp: -1 }`

**Relationships:**
- Referenced by `alerts.sensorData`

### 4. Actuators Collection

```javascript
{
  _id: ObjectId,
  deviceId: String (required, unique),
  name: String (required),
  type: String (required, enum: ['pump', 'fan', 'valve', 'light', 'heater', 'cooler']),
  status: String (enum: ['on', 'off', 'error'], default: 'off'),
  location: {
    zone: String,
    field: String
  },
  isAutomatic: Boolean (default: false),
  lastControlled: {
    by: String,
    at: Date,
    action: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ deviceId: 1 }` (unique)
- `{ type: 1, status: 1 }`
- `{ "location.zone": 1 }`

**Relationships:**
- Referenced by `alerts.device`
- Referenced by `thresholds.action.deviceId`

### 5. Thresholds Collection

```javascript
{
  _id: ObjectId,
  name: String (required, trim),
  sensorType: String (required, enum: ['temperature', 'humidity', 'light', 'soilMoisture', 'soilPH'], indexed),
  farmZone: String (default: 'default'),
  minValue: Number (required),
  maxValue: Number (required),
  action: {
    type: String (enum: ['control_device', 'send_alert', 'both'], default: 'both'),
    deviceId: String,
    deviceAction: String (enum: ['on', 'off', 'toggle']),
    alertType: String (enum: ['email', 'sms', 'push', 'all'], default: 'email'),
    recipients: [String]
  },
  isActive: Boolean (default: true),
  createdBy: ObjectId (ref: 'User'),
  updatedBy: ObjectId (ref: 'User'),
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ sensorType: 1, isActive: 1 }`
- `{ farmZone: 1, isActive: 1 }`
- `{ createdBy: 1 }`

**Relationships:**
- `createdBy` → `users._id`
- `updatedBy` → `users._id`
- Referenced by `alerts.threshold`

### 6. Alerts Collection

```javascript
{
  _id: ObjectId,
  type: String (required, enum: ['threshold_exceeded', 'device_malfunction', 'system_error', 'manual'], indexed),
  severity: String (required, enum: ['low', 'medium', 'high', 'critical'], default: 'medium'),
  sensorData: {
    sensorId: String,
    sensorType: String,
    value: Number,
    timestamp: Date
  },
  threshold: ObjectId (ref: 'Threshold'),
  device: ObjectId (ref: 'Actuator'),
  title: String (required),
  message: String (required),
  notifications: [{
    channel: String (enum: ['email', 'sms', 'push', 'websocket']),
    recipient: String,
    status: String (enum: ['pending', 'sent', 'failed', 'delivered'], default: 'pending'),
    sentAt: Date,
    error: String
  }],
  status: String (enum: ['new', 'acknowledged', 'resolved', 'dismissed'], default: 'new', indexed),
  acknowledgedBy: ObjectId (ref: 'User'),
  acknowledgedAt: Date,
  resolvedBy: ObjectId (ref: 'User'),
  resolvedAt: Date,
  resolutionNotes: String,
  farmZone: String,
  expiresAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ type: 1, status: 1, createdAt: -1 }`
- `{ severity: 1, status: 1 }`
- `{ expiresAt: 1 }` (TTL index)

**Relationships:**
- `threshold` → `thresholds._id`
- `device` → `actuators._id`
- `acknowledgedBy` → `users._id`
- `resolvedBy` → `users._id`

---

## 🔍 Key Relationships Summary

### One-to-Many Relationships:
- **User → Role**: Many users can have the same role
- **User → Threshold**: Users create/update thresholds
- **User → Alert**: Users acknowledge/resolve alerts
- **Threshold → Alert**: One threshold can generate multiple alerts
- **Actuator → Alert**: One device can have multiple alerts

### Many-to-Many Relationships:
- **Threshold ↔ SensorData**: Thresholds apply to sensor types, alerts link specific sensor readings
- **Threshold ↔ Actuator**: Thresholds can control multiple devices

### Time Series Relationships:
- **SensorData**: Optimized for time-based queries and aggregations
- **Alerts**: Linked to sensor data snapshots for historical context

---

## ⚡ Performance Optimizations

### Indexing Strategy:
1. **Compound Indexes**: For common query patterns
2. **Time-based Indexes**: For sensor data and alerts
3. **TTL Indexes**: Auto-expire old alerts
4. **Sparse Indexes**: For optional fields

### Time Series Optimizations:
- **Granularity**: 'minutes' for sensor data
- **Meta Field**: sensorId for partitioning
- **Automatic Indexing**: On timestamp field

### Query Patterns Optimized:
- Get active thresholds by sensor type
- Get sensor data by time range
- Get alerts by status and type
- Get devices by location and status

---

## 🔒 Data Validation & Constraints

### Required Fields:
- All entities have required fields marked
- Enum constraints for controlled vocabularies
- Unique constraints on identifiers

### Business Rules:
- Users must have valid roles
- Thresholds must have valid sensor types
- Alerts must have valid severity levels
- Sensor data must have valid units

### Data Integrity:
- Reference constraints via Mongoose refs
- Cascade operations handled in application layer
- Soft deletes via `isActive` flags

---

## 📈 Scalability Considerations

### Sharding Strategy:
- **SensorData**: Shard by sensorId + timestamp
- **Alerts**: Shard by type + createdAt
- **Users**: Shard by role

### Read/Write Patterns:
- **Heavy Reads**: Sensor data queries
- **Heavy Writes**: Sensor data ingestion
- **Mixed**: User management, alerts

### Backup Strategy:
- Daily backups for all collections
- Point-in-time recovery for critical data
- Archive old sensor data to cold storage

---

## 🛠️ Database Operations

### Common Queries:

```javascript
// Get active thresholds for sensor type
db.thresholds.find({ sensorType: 'temperature', isActive: true })

// Get sensor data for last 24 hours
db.sensordatas.find({
  sensorId: 'temp-01',
  timestamp: { $gte: new Date(Date.now() - 24*60*60*1000) }
})

// Get unresolved alerts
db.alerts.find({ status: { $ne: 'resolved' } })

// Get devices by zone
db.actuators.find({ 'location.zone': 'zone-1' })
```

### Aggregation Pipelines:

```javascript
// Average temperature by hour
db.sensordatas.aggregate([
  { $match: { sensorType: 'temperature' } },
  { $group: {
    _id: {
      $dateToString: { format: '%Y-%m-%d %H', date: '$timestamp' }
    },
    avgTemp: { $avg: '$value' },
    count: { $sum: 1 }
  }}
])
```

---

**Database Design completed on:** October 31, 2025  
**MongoDB Version:** 6.0+  
**Mongoose Version:** 8.0+</content>
<parameter name="filePath">e:\SWD392\DATABASE_DESIGN.md