# Wasteio — Smart Waste Management Platform

Live app: **[wasteio.tosak.net](https://wasteio.tosak.net)**

Wasteio is a real-time waste management platform for municipalities and sanitation operators. IoT containers publish telemetry over MQTT, the backend ingests and persists it, and operators manage the fleet through a web dashboard with live data streaming.

## Architecture

```
container-device-simulator/   # Go — simulates IoT container devices over MQTT
wasteio-api/                  # Spring Boot (Java 21) — REST API + MQTT consumer + SSE broadcaster
wasteio-frontend/             # React 19 + TypeScript — operator dashboard
```

### How it fits together

1. **Simulator** — each virtual device independently tracks fill level and battery, publishes telemetry to `waste/containers/{id}/telemetry` (MQTT), and listens for pickup commands on `waste/containers/{id}/commands`.
2. **Backend** — subscribes to MQTT, persists telemetry to PostgreSQL, detects pickups from fill-level drops, and broadcasts live updates to the frontend via Server-Sent Events (SSE). Exposes a REST API secured with JWT.
3. **Frontend** — operators see containers on a live map, manage pickup routes, view analytics reports, and administer users. Admins can also control simulator parameters from the dashboard.

## Services

| Service | Tech | Purpose |
|---|---|---|
| `container-device-simulator` | Go 1.22, MQTT | IoT device simulation |
| `wasteio-api` | Spring Boot 4, Java 21, PostgreSQL, Mosquitto | Backend API + telemetry ingestion |
| `wasteio-frontend` | React 19, TypeScript, Vite, Tailwind CSS 4 | Operator web dashboard |

## Running locally

Each service has its own setup. Start them in order:

**1. MQTT broker**
```bash
cd container-device-simulator
docker compose up -d
```

**2. Backend**

Set the required environment variables (`DB_URL`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`) then:
```bash
cd wasteio-api
./mvnw spring-boot:run
```

**3. Simulator**
```bash
cd container-device-simulator
go run .
```

**4. Frontend**
```bash
cd wasteio-frontend
npm install
npm run dev
```

See each subdirectory's README for full configuration options.

## Features

- Live container map with fill level, battery, and status indicators
- Real-time telemetry streaming via SSE
- Container CRUD with full lifecycle management
- Pickup route planning and active pickup tracking
- Analytics dashboard — fill trends, container health, waste stream breakdown
- Alert system for sensor thresholds
- Admin panel — invite-link based user registration, role management
- Simulator control panel — adjust fill rate, telemetry interval, and trigger pickups from the UI
