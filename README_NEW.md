# 🌾 Smart Agriculture System (SAS)

> **IoT-based Smart Agriculture Management System** with automated irrigation, real-time monitoring, and intelligent alerting.

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v8+-brightgreen.svg)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-v4.18-blue.svg)](https://expressjs.com/)
[![MQTT](https://img.shields.io/badge/MQTT-v5.3-orange.svg)](https://mqtt.org/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Technology Stack](#-technology-stack)
- [Use Cases Coverage](#-use-cases-coverage)
- [Documentation](#-documentation)

---

## 🎯 Overview

Smart Agriculture System (SAS) is an IoT application that helps farmers and technicians to:

- 📊 **Monitor** farm environment (temperature, humidity, light, soil moisture)
- 🎮 **Control** devices automatically (pumps, fans, lights)
- 🤖 **Automate** irrigation and ventilation based on thresholds
- 🔔 **Alert** via Email/SMS/Push when thresholds exceeded
- 📈 **Analyze** historical data and generate reports
- 👥 **Manage** users with role-based access control

---

## ✨ Features

### ✅ Implemented

- [x] **User Authentication & Authorization** (JWT-based)
- [x] **Role-Based Access Control** (Admin, Owner, Technician, Worker)
- [x] **MQTT Sensor Data Collection** (Real-time IoT integration)
- [x] **Manual Device Control** (REST API)
- [x] **Threshold Management** (Configure min/max values)
- [x] **Automated Rule Engine** (Auto-control based on thresholds)
- [x] **Multi-Channel Notifications** (Email, SMS, Push)
- [x] **Alert Management** (Acknowledge, Resolve, Statistics)
- [x] **WebSocket Real-time Updates** (Live dashboard data)
- [x] **Event-Driven Architecture** (Loose-coupled components)
- [x] **API Gateway** (Centralized routing)
- [x] **Logging System** (Winston-based)

### ⏳ Planned

- [ ] **Dashboard Analytics** (Historical data visualization)
- [ ] **Report Generation** (Sensor data, device usage, alerts)
- [ ] **Incident Management** (Device malfunction reporting)
- [ ] **Multi-tenancy Support** (Multiple farms)
- [ ] **Advanced Analytics** (ML-based predictions)
- [ ] **Data Backup & Restore**
- [ ] **gRPC Inter-service Communication**

---

## 🏗️ Architecture

### Component-Based Clean Architecture

```
┌─────────────────────────────────────────────────────────┐
│              CLIENT LAYER                               │
│   Web Dashboard │ Mobile App │ IoT Devices             │
└──────┬────────────────┬──────────────┬──────────────────┘
       │                │              │
  ┌────▼────┐     ┌────▼─────┐   ┌───▼───┐
  │   API   │     │WebSocket │   │  MQTT │
  │ Gateway │     │ Gateway  │   │       │
  └────┬────┘     └────┬─────┘   └───┬───┘
       └─────────┬─────┴─────────────┘
                 │
┌────────────────▼─────────────────────────────────────────┐
│             COMPONENT LAYER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │    User     │  │    Data     │  │   Device    │     │
│  │ Management  │  │ Ingestion   │  │   Control   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│  ┌─────────────┐  ┌─────────────┐                      │
│  │ Automation  │  │ Monitoring  │                      │
│  │   Engine    │  │  & Logging  │                      │
│  └─────────────┘  └─────────────┘                      │
└────────────────────┬─────────────────────────────────────┘
                     │
        ┌────────────▼────────────┐
        │    SHARED KERNEL        │
        │  Config │ Logger │ DB   │
        └────────────┬────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│          INFRASTRUCTURE LAYER                            │
│   MongoDB │ MQTT Broker │ Email/SMS │ WebSocket          │
└──────────────────────────────────────────────────────────┘
```

### 4-Layer Architecture per Component

Each component follows **Clean Architecture** principles:

1. **Presentation Layer** - Controllers (HTTP handlers)
2. **Application Layer** - Services (Business logic)
3. **Domain Layer** - Entities (Core models)
4. **Infrastructure Layer** - Repositories (Data access)

**More details:** See [ARCHITECTURE.md](ARCHITECTURE.md)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v20+ ([Download](https://nodejs.org/))
- **MongoDB** v8+ (Optional - can run in demo mode)
- **MQTT Broker** (Optional - can run in demo mode)
- **Git**

### Installation

```bash
# 1. Clone repository
git clone https://github.com/nguyenluongk2k4/SWD392_DemoCodeSWD392.git
cd SWD392

# 2. Install dependencies
npm install

# 3. Configure environment
# Create .env file with your settings

# 4. Start server
npm start
```

Server will run at: **http://localhost:3000**

### Configuration

Create `.env` file:

```env
# Server
PORT=3000
NODE_ENV=development

# Database (set to false for demo mode without MongoDB)
ENABLE_DATABASE=false
MONGODB_URI=mongodb://localhost:27017/smart_agriculture

# MQTT (set to false for demo mode without MQTT broker)
ENABLE_MQTT=false
MQTT_BROKER_URL=mqtt://localhost:1883

# JWT
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRES_IN=24h

# Email Notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Quick Test

```bash
# Health check
curl http://localhost:3000/health

# View architecture documentation
curl http://localhost:3000/api/demo/architecture-flow
```

---

## 📚 API Documentation

### Base URL: `http://localhost:3000/api`

### 🔐 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login and get JWT token |

### 👥 Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/users` | Get all users | ✅ Required |
| POST | `/users` | Create new user | ✅ Admin |
| PUT | `/users/:id` | Update user | ✅ Admin |
| DELETE | `/users/:id` | Delete user | ✅ Admin |

### 🎮 Devices

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/devices/control` | Control device (on/off) |

### ⚙️ Thresholds

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/thresholds` | Get all thresholds |
| POST | `/thresholds` | Create new threshold |
| PUT | `/thresholds/:id` | Update threshold |
| DELETE | `/thresholds/:id` | Delete threshold |
| PATCH | `/thresholds/:id/toggle` | Activate/deactivate |

### 🔔 Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/alerts` | Get all alerts |
| GET | `/alerts/active` | Get active alerts |
| POST | `/alerts/:id/acknowledge` | Acknowledge alert |
| POST | `/alerts/:id/resolve` | Resolve alert |

**See [dac_ta.md](dac_ta.md) for complete API documentation**

---

## 📁 Project Structure

```
/SWD392
├── /components              # Business components
│   ├── /user-management    # UC01, UC06, UC07
│   ├── /data-ingestion     # UC08
│   ├── /device-control     # UC03, UC12
│   ├── /automation-engine  # UC04, UC05, UC09 ✅
│   └── /monitoring-logging # UC02, UC10, UC13
│
├── /gateways
│   ├── /api-gateway        # REST API Gateway
│   └── /websocket-gateway  # WebSocket Gateway
│
├── /shared-kernel
│   ├── /config             # Configuration
│   ├── /database           # MongoDB connection
│   ├── /event-bus          # Event-driven communication
│   └── /utils              # Logger, validators
│
├── /src
│   └── index.js            # Main entry point
│
├── /logs                   # Application logs
├── ARCHITECTURE.md         # Architecture documentation
├── dac_ta.md              # Specification document
└── package.json
```

---

## 🛠️ Technology Stack

| Category | Technology |
|----------|------------|
| **Runtime** | Node.js v20+ |
| **Framework** | Express.js |
| **Database** | MongoDB + Mongoose |
| **IoT Protocol** | MQTT (mqtt.js) |
| **Real-time** | Socket.IO |
| **Authentication** | JWT |
| **Email** | NodeMailer |
| **Logging** | Winston |

---

## 🎓 Use Cases Coverage

| ID | Use Case | Status | Component |
|----|----------|--------|-----------|
| UC01 | Login/Authentication | ✅ Done | User Management |
| UC02 | View sensor data | ⏳ API Ready | Monitoring |
| UC03 | Control devices | ✅ Done | Device Control |
| UC04 | Auto irrigation | ✅ Done | Automation Engine |
| UC05 | Configure thresholds | ✅ Done | Automation Engine |
| UC06 | Manage users | ✅ Done | User Management |
| UC07 | Manage roles | ✅ Done | User Management |
| UC08 | View reports | ⏳ Planned | Monitoring |
| UC09 | Send alerts | ✅ Done | Automation Engine |
| UC10 | View logs | ✅ Done | Winston |
| UC11 | Configure broker | ✅ Done | Config |
| UC12 | Device status | ✅ Done | Device Control |
| UC13 | Report incidents | ⏳ Planned | Monitoring |
| UC14 | Backup/Restore | ⏳ Planned | TBD |

**Legend:** ✅ Done | ⏳ Planned | ❌ Not Started

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Complete architecture documentation |
| [dac_ta.md](dac_ta.md) | Software specification document |

---

## 👨‍💻 Development

### Scripts

```bash
npm start       # Start production server
npm run dev     # Start development server (nodemon)
```

### Demo Mode

Run without MongoDB and MQTT:
```env
ENABLE_DATABASE=false
ENABLE_MQTT=false
```

---

## 📝 License

This project is licensed under the **ISC License**.

---

## 👥 Team

**SWD392 Project** - Smart Agriculture System

- **Course:** SWD392 - Software Architecture and Design
- **Semester:** Fall 2025
- **University:** FPT University

---

**Made with ❤️ for Smart Agriculture**

© 2025 SWD392 Project
