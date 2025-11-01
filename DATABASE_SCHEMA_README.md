# Database Schema Documentation

## 📋 Files Overview

### 1. `database_schema.json`
- **Purpose**: JSON Schema validation for database structure
- **Usage**: API validation, documentation, testing
- **Standard**: JSON Schema Draft 7
- **Collections**: 6 main collections with full validation rules

### 2. `database_schemas.js`
- **Purpose**: Mongoose models for Node.js application
- **Usage**: Direct database operations in Express.js
- **Features**: Full validation, indexes, relationships
- **Models**: User, Role, SensorData, Actuator, Threshold, Alert

## 🗂️ Collections Summary

| Collection | Purpose | Key Fields | Relationships |
|------------|---------|------------|---------------|
| `users` | User accounts | username, email, role | → roles |
| `roles` | Permissions | name, permissions | ← users |
| `sensordatas` | IoT readings | sensorId, value, timestamp | - |
| `actuators` | Devices | deviceId, status, mode | ← alerts |
| `thresholds` | Automation rules | sensorType, min/max, action | → users, ← alerts |
| `alerts` | Notifications | type, severity, status | → users, → thresholds, → actuators |

## 🔗 Relationships

### One-to-Many:
- **User → Role**: Users belong to roles
- **User → Threshold**: Users create thresholds
- **User → Alert**: Users acknowledge/resolve alerts
- **Threshold → Alert**: Thresholds generate alerts
- **Actuator → Alert**: Devices have alerts

### Many-to-One:
- **Alert → Threshold**: Alerts reference thresholds
- **Alert → Actuator**: Alerts reference devices
- **Alert → User**: Alerts reference acknowledging users

## 📊 Indexes

### Performance Indexes:
- **SensorData**: `{ sensorId: 1, timestamp: -1 }`, `{ sensorType: 1, timestamp: -1 }`
- **Alerts**: `{ type: 1, status: 1, createdAt: -1 }`, `{ severity: 1, status: 1 }`
- **Thresholds**: `{ sensorType: 1, isActive: 1 }`, `{ farmId: 1, zoneId: 1 }`

### Unique Indexes:
- **Users**: `username`, `email`
- **Roles**: `name`
- **Actuators**: `deviceId`

### TTL Indexes:
- **Alerts**: Auto-expire resolved alerts after 30 days

## 🚀 Usage Examples

### Using Mongoose Models (database_schemas.js):

```javascript
const { User, SensorData, Alert } = require('./database_schemas');

// Create a new user
const user = new User({
  username: 'farmer1',
  email: 'farmer@example.com',
  password: 'hashed_password',
  fullName: 'John Farmer',
  role: roleObjectId
});

// Save sensor data
const sensorReading = new SensorData({
  sensorId: 'temp-01',
  sensorType: 'temperature',
  value: 25.5,
  unit: '°C',
  farmId: 'farm-001',
  zoneId: 'zone-1'
});

// Query active alerts
const activeAlerts = await Alert.find({
  status: { $in: ['new', 'acknowledged'] }
}).populate('threshold').sort({ createdAt: -1 });
```

### JSON Schema Validation:

```javascript
const Ajv = require('ajv');
const ajv = new Ajv();
const schema = require('./database_schema.json');

const validate = ajv.compile(schema.properties.users);
const valid = validate(userData);
```

## 🔧 Validation Rules

### Required Fields:
- All entities have mandatory fields marked
- Email format validation
- Phone number pattern matching
- Enum restrictions for controlled values

### Business Rules:
- Thresholds: `minValue < maxValue`
- Sensor data: Valid units for sensor types
- Alerts: Proper status workflow
- Users: Unique username/email combinations

### Data Types:
- **Strings**: Trimmed, length validated
- **Numbers**: Range validated where applicable
- **Dates**: ISO format, auto-timestamps
- **Arrays**: Controlled enum values
- **Objects**: Nested validation for complex structures

## 📈 Performance Optimizations

### Time Series (SensorData):
- Optimized for time-based queries
- Automatic compression in MongoDB 5.0+
- Granularity: minutes for efficient storage

### Query Patterns:
- Sensor data by time range
- Alerts by status and type
- Devices by location and status
- Thresholds by sensor type and zone

### Indexing Strategy:
- Compound indexes for common query combinations
- Sparse indexes for optional fields
- TTL indexes for data lifecycle management

## 🔒 Security Considerations

### Data Validation:
- Input sanitization at schema level
- Type coercion prevention
- Enum restrictions for controlled inputs

### Access Control:
- Role-based permissions
- User ownership validation
- Audit trails with created/updated by fields

### Sensitive Data:
- Passwords: Hashed with bcrypt
- Personal data: Proper validation and sanitization

## 🧪 Testing

### Schema Validation:
```bash
# Validate JSON schema
npx ajv validate -s database_schema.json -d test_data.json

# Test Mongoose models
npm test
```

### Data Integrity:
- Foreign key relationships maintained
- Cascade operations handled in application layer
- Soft deletes via `isActive` flags

---

**Schema Version**: 1.0.0
**MongoDB Version**: 5.0+
**Mongoose Version**: 8.0+
**Last Updated**: October 31, 2025</content>
<parameter name="filePath">e:\SWD392\DATABASE_SCHEMA_README.md