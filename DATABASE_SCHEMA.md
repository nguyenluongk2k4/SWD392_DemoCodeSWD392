# 📊 Database Schema - SQL-like Representation

## 🏗️ Relational View (For Understanding)

Dưới đây là biểu diễn schema dưới dạng SQL để dễ hiểu relationships:

```sql
-- Users Table
CREATE TABLE users (
    id VARCHAR(24) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    role_id VARCHAR(24) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Roles Table
CREATE TABLE roles (
    id VARCHAR(24) PRIMARY KEY,
    name ENUM('admin', 'manager', 'operator', 'viewer') UNIQUE NOT NULL,
    description TEXT,
    permissions JSON, -- Array of permission strings
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- SensorData Table (Time Series)
CREATE TABLE sensor_data (
    id VARCHAR(24) PRIMARY KEY,
    sensor_id VARCHAR(50) NOT NULL,
    sensor_type ENUM('temperature', 'humidity', 'soil_moisture', 'light', 'ph', 'nutrient') NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    zone VARCHAR(50),
    field VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    quality ENUM('good', 'warning', 'critical') DEFAULT 'good',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_sensor_time (sensor_id, timestamp),
    INDEX idx_type_time (sensor_type, timestamp),
    INDEX idx_zone_time (zone, timestamp)
);

-- Actuators Table
CREATE TABLE actuators (
    id VARCHAR(24) PRIMARY KEY,
    device_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type ENUM('pump', 'fan', 'valve', 'light', 'heater', 'cooler') NOT NULL,
    status ENUM('on', 'off', 'error') DEFAULT 'off',
    zone VARCHAR(50),
    field VARCHAR(50),
    is_automatic BOOLEAN DEFAULT FALSE,
    last_controlled_by VARCHAR(100),
    last_controlled_at TIMESTAMP,
    last_action VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_device_id (device_id),
    INDEX idx_type_status (type, status),
    INDEX idx_zone (zone)
);

-- Thresholds Table
CREATE TABLE thresholds (
    id VARCHAR(24) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sensor_type ENUM('temperature', 'humidity', 'light', 'soilMoisture', 'soilPH') NOT NULL,
    farm_zone VARCHAR(50) DEFAULT 'default',
    min_value DECIMAL(10,2) NOT NULL,
    max_value DECIMAL(10,2) NOT NULL,
    action_type ENUM('control_device', 'send_alert', 'both') DEFAULT 'both',
    device_id VARCHAR(50),
    device_action ENUM('on', 'off', 'toggle'),
    alert_type ENUM('email', 'sms', 'push', 'all') DEFAULT 'email',
    recipients JSON, -- Array of email addresses
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(24),
    updated_by VARCHAR(24),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),

    INDEX idx_sensor_active (sensor_type, is_active),
    INDEX idx_zone_active (farm_zone, is_active),
    INDEX idx_created_by (created_by)
);

-- Alerts Table
CREATE TABLE alerts (
    id VARCHAR(24) PRIMARY KEY,
    type ENUM('threshold_exceeded', 'device_malfunction', 'system_error', 'manual') NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    sensor_id VARCHAR(50),
    sensor_type VARCHAR(50),
    sensor_value DECIMAL(10,2),
    sensor_timestamp TIMESTAMP,
    threshold_id VARCHAR(24),
    device_id VARCHAR(24),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notifications JSON, -- Array of notification objects
    status ENUM('new', 'acknowledged', 'resolved', 'dismissed') DEFAULT 'new',
    acknowledged_by VARCHAR(24),
    acknowledged_at TIMESTAMP,
    resolved_by VARCHAR(24),
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    farm_zone VARCHAR(50),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (threshold_id) REFERENCES thresholds(id),
    FOREIGN KEY (device_id) REFERENCES actuators(id),
    FOREIGN KEY (acknowledged_by) REFERENCES users(id),
    FOREIGN KEY (resolved_by) REFERENCES users(id),

    INDEX idx_type_status_time (type, status, created_at),
    INDEX idx_severity_status (severity, status),
    INDEX idx_expires (expires_at)
);
```

## 🔗 Relationships Diagram (ASCII Art)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                               USERS                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ • id (PK)                                                                  │
│ • username (UK)                                                            │
│ • email (UK)                                                               │
│ • password                                                                 │
│ • full_name                                                                │
│ • phone_number                                                             │
│ • role_id (FK → roles.id)                                                  │
│ • is_active                                                                │
│ • last_login                                                               │
│ • created_at                                                               │
│ • updated_at                                                               │
└─────────────────┬───────────────────────────────────────────────────────────┘
                  │ 1
                  │
                  │ *
┌─────────────────▼───────────────────────────────────────────────────────────┐
│                               ROLES                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ • id (PK)                                                                  │
│ • name (UK, ENUM)                                                          │
│ • description                                                              │
│ • permissions (JSON Array)                                                 │
│ • created_at                                                               │
│ • updated_at                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            THRESHOLDS                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ • id (PK)                                                                  │
│ • name                                                                     │
│ • sensor_type (ENUM)                                                       │
│ • farm_zone                                                                │
│ • min_value                                                                │
│ • max_value                                                                │
│ • action_type (ENUM)                                                       │
│ • device_id                                                                │
│ • device_action (ENUM)                                                     │
│ • alert_type (ENUM)                                                        │
│ • recipients (JSON Array)                                                  │
│ • is_active                                                                │
│ • created_by (FK → users.id)                                               │
│ • updated_by (FK → users.id)                                               │
│ • description                                                              │
│ • created_at                                                               │
│ • updated_at                                                               │
└─────────────────┬───────────────────────────────────────────────────────────┘
                  │ 1
                  │
                  │ *
┌─────────────────▼───────────────────────────────────────────────────────────┐
│                              ALERTS                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ • id (PK)                                                                  │
│ • type (ENUM)                                                              │
│ • severity (ENUM)                                                          │
│ • sensor_id                                                                │
│ • sensor_type                                                              │
│ • sensor_value                                                             │
│ • sensor_timestamp                                                         │
│ • threshold_id (FK → thresholds.id)                                        │
│ • device_id (FK → actuators.id)                                            │
│ • title                                                                    │
│ • message                                                                  │
│ • notifications (JSON Array)                                               │
│ • status (ENUM)                                                            │
│ • acknowledged_by (FK → users.id)                                          │
│ • acknowledged_at                                                          │
│ • resolved_by (FK → users.id)                                              │
│ • resolved_at                                                              │
│ • resolution_notes                                                         │
│ • farm_zone                                                                │
│ • expires_at                                                               │
│ • created_at                                                               │
│ • updated_at                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           SENSOR_DATA                                       │
│                        (TIME SERIES)                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ • id (PK)                                                                  │
│ • sensor_id                                                                │
│ • sensor_type (ENUM)                                                       │
│ • value                                                                    │
│ • unit                                                                     │
│ • zone                                                                     │
│ • field                                                                    │
│ • timestamp                                                                │
│ • quality (ENUM)                                                           │
│ • created_at                                                               │
│ • updated_at                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            ACTUATORS                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ • id (PK)                                                                  │
│ • device_id (UK)                                                           │
│ • name                                                                     │
│ • type (ENUM)                                                              │
│ • status (ENUM)                                                            │
│ • zone                                                                     │
│ • field                                                                    │
│ • is_automatic                                                             │
│ • last_controlled_by                                                       │
│ • last_controlled_at                                                       │
│ • last_action                                                              │
│ • created_at                                                               │
│ • updated_at                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 📈 Data Flow Relationships

### 1. User Management Flow:
```
User (role) → Role (permissions)
User (created_by/updated_by) → Threshold
User (acknowledged_by/resolved_by) → Alert
```

### 2. Automation Flow:
```
SensorData (sensor_type) → Threshold (sensor_type)
Threshold (action.device_id) → Actuator (device_id)
Threshold (id) → Alert (threshold_id)
Actuator (id) → Alert (device_id)
```

### 3. Alert Flow:
```
Alert (sensor_id, sensor_type, sensor_value) ← SensorData
Alert (threshold_id) ← Threshold
Alert (device_id) ← Actuator
Alert (acknowledged_by/resolved_by) ← User
```

## 🔑 Key Constraints & Rules

### Uniqueness:
- `users.username` - Unique across system
- `users.email` - Unique across system
- `roles.name` - Unique across system
- `actuators.device_id` - Unique across system

### Foreign Keys:
- `users.role_id` → `roles.id`
- `thresholds.created_by` → `users.id`
- `thresholds.updated_by` → `users.id`
- `alerts.threshold_id` → `thresholds.id`
- `alerts.device_id` → `actuators.id`
- `alerts.acknowledged_by` → `users.id`
- `alerts.resolved_by` → `users.id`

### Business Rules:
- Thresholds must have `min_value < max_value`
- Alerts must have valid `sensor_data` snapshot
- Users must have active roles
- Actuators can only be controlled by authorized users

### Data Validation:
- Sensor types must match threshold sensor types
- Device actions must be valid for device types
- Alert severities must match business logic
- Timestamps must be valid and in sequence

---

**Schema Design completed on:** October 31, 2025  
**Format:** SQL-like representation for clarity  
**Purpose:** Understanding relationships and constraints</content>
<parameter name="filePath">e:\SWD392\DATABASE_SCHEMA.md