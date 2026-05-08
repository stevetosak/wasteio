# wasteio-api

Backend service for managing smart waste containers with REST CRUD operations, real-time MQTT telemetry ingestion, and pickup event tracking.

## Features

- REST API for container management (CRUD)
- MQTT telemetry ingestion with fill level tracking
- MQTT event ingestion for discrete container events (e.g. emptied)
- Automatic pickup detection and recording
- PostgreSQL database with Flyway migrations
- Container seed data synced from simulator `devices.json` on startup

## Running the Application

1. Start PostgreSQL:
   ```bash
   docker-compose up -d
   ```

2. Set environment variables:
   ```
   DB_URL=jdbc:postgresql://<your_postgres_host>
   DB_NAME=<your_db_name>
   DB_USER=<your_db_username>
   DB_PASS=<your_db_pass>
   ```

3. Run:
   ```bash
   ./mvnw spring-boot:run
   ```

## MQTT Integration

### Inbound Topics

| Topic | Description |
|---|---|
| `waste/containers/{deviceId}/telemetry` | Periodic sensor readings (fill level, battery) |
| `waste/containers/{deviceId}/events` | Discrete device events (e.g. `emptied`) |

### Outbound Topics

| Topic | Description |
|---|---|
| `waste/containers/{deviceId}/commands` | Manual pickup commands sent from the API |

### Telemetry Payload
```json
{
  "containerId": "container-001",
  "fillLevel": 78.5,
  "batteryLevel": 92.3,
  "timestamp": "2026-05-06T12:00:00Z",
  "location": { "lat": 41.9981, "lng": 21.4254 }
}
```

### Event Payload
```json
{
  "containerId": "container-001",
  "eventType": "emptied",
  "fillLevel": 5.4,
  "timestamp": "2026-05-06T12:00:00Z"
}
```

## REST API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/devices` | Get all containers |
| GET | `/api/devices/{id}` | Get container by ID |
| POST | `/api/devices` | Create new container |
| PUT | `/api/devices/{id}` | Update container |
| DELETE | `/api/devices/{id}` | Delete container |
| POST | `/api/devices/{id}/pickup` | Trigger manual pickup command via MQTT |

## Demo Devices

Containers are seeded from `../container-device-simulator/devices.json` on every startup. To add a new demo device, append an entry to that file and restart the API:

```json
{
  "containerId": "container-004",
  "location": { "lat": 42.0050, "lng": 21.4300 }
}
```