# Smart Agriculture – AI Agent Guide

## Architecture Snapshot
- Monorepo with Node/Express backend and React/CRACO frontend; backend entry is `src/index.js`, client lives in `client/`.
- Clean-architecture folders inside `components/<domain>/{presentation,application,domain,infrastructure}`. Mirror this layout when adding features.
- Event-driven core via `shared-kernel/event-bus/index.js`; publish with `eventBus.publish(Events.X, payload)` and subscribe with `eventBus.subscribe`.
- API Gateway (`gateways/api-gateway/index.js`) wires Express routes, while `gateways/websocket-gateway/index.js` pushes real-time updates.
- Automation flow: `MqttHandler` → `DataCollectorService` → `eventBus` → `AutomationService` → `NotificationService` / `ActuatorService` → WebSocket; follow this pipeline for new sensor logic.

## Runtime & Config
- Env toggles in `.env`: `ENABLE_DATABASE`, `ENABLE_MQTT`, and MQTT topics (`MQTT_TOPIC_SENSOR_DATA`, etc.). Backend warns instead of crashing when disabled—preserve that behavior.
- Mongo connection managed by `shared-kernel/database/index.js`; check `config.database.enabled` before hitting repositories.
- MQTT defaults to sensors/# and devices/+/control; keep new topics consistent with this pattern.
- Logging handled by `shared-kernel/utils/logger.js` (Winston → `logs/combined.log` / `error.log`). Use it instead of `console`.

## Developer Workflows
- Backend: `npm start` (prod-style) or `npm run dev` (nodemon).
- Frontend: `cd client && npm start` (CRACO). Both can be launched via `run-local.bat` on Windows.
- No automated tests yet; keep manual verification steps in PR descriptions.
- Seed roles with `RoleRepository.initializeDefaultRoles()` during startup; ensure new roles fit existing permission enums.

## Schema & Data
- Canonical schema definitions live in `database_schemas.js` (Mongoose) and supporting docs (`DATABASE_DESIGN.md`, `IMPLEMENTATION_SUMMARY.md`).
- Sensor data stored as Mongo time-series (`SensorData`); honor required fields `sensorId`, `sensorType`, `timestamp`, `value`.
- Alerts/thresholds interlink: `Alerts.threshold.thresholdId` → `Threshold` and `Alerts.device.deviceId` → `Actuator`; maintain these refs when extending models.

## Frontend Conventions
- CRACO aliasing for styles/assets; components import shared CSS from `client/src/styles`. Match existing relative paths when creating new components.
- WebSocket updates consumed inside client components (see `client/src/components`); expose new events via the gateway instead of polling APIs.

## Extending the System
- Add new business capabilities by creating all four layers inside the relevant `components/<domain>` folder and exposing routes through the API Gateway.
- Publish domain events for cross-component work rather than calling services directly.
- Update documentation (`ARCHITECTURE.md`, `DATABASE_*`) when modifying data flows or schemas.
