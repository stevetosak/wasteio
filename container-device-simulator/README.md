# Container Device Simulator

Simulates a fleet of IoT waste containers. Each device publishes fill level telemetry over MQTT and responds to pickup commands.

## Requirements

- Go 1.21+
- Docker + Docker Compose

## Running

**1. Start the MQTT broker**

```bash
docker compose up -d
```

**2. Run the simulator**

```bash
go run .
```

Devices are loaded from `devices.json`. Each device starts a goroutine that publishes telemetry to `waste/containers/{id}/telemetry` every 5 seconds.

## Telemetry payload

```json
{
  "containerId": "container-001",
  "fillLevel": 42.35,
  "batteryLevel": 91.20,
  "timestamp": "2026-05-05T12:00:00Z",
  "location": { "lat": 41.9981, "lng": 21.4254 }
}
```

Fill level drifts upward over time. Battery drains slowly.

## Simulating a pickup

Send a command to a device's command topic. The device will reset its fill level to ~0–5%:

```bash
mosquitto_pub -h localhost -t "waste/containers/container-001/commands" -m "pickup"
```

The backend detects pickups by observing an 80%+ drop in fill level between telemetry readings.

## Monitoring all topics

```bash
mosquitto_sub -h localhost -t "waste/containers/#" -v
```

## Adding devices

Edit `devices.json` and add entries with a unique `containerId` and starting `location`:

```json
{
  "containerId": "container-004",
  "location": { "lat": 42.0050, "lng": 21.4100 }
}
```

Restart the simulator for changes to take effect.

## Configuration

| Setting | Default | Description |
|---|---|---|
| Broker URL | `tcp://localhost:1883` | Set in `main.go` |
| Telemetry interval | 5 seconds | Set in `device/device.go` |
| Fill drift per tick | 1.5–3.5% | Set in `device/device.go` |
