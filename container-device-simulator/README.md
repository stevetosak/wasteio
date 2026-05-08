# Container Device Simulator

Simulates a fleet of IoT waste containers. Each device independently tracks fill level and battery, publishes telemetry over MQTT, and responds to pickup commands.

## Requirements

- Go 1.22+
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

All parameters are optional — defaults match the table below. Example with custom values:

```bash
go run . -fill-interval 3s -telemetry-interval 5s -fill-rate-max 8.0
```

## Configuration flags

| Flag | Default | Description |
|---|---|---|
| `-broker` | `tcp://localhost:1883` | MQTT broker URL |
| `-fill-interval` | `5s` | How often fill level updates |
| `-battery-interval` | `30s` | How often battery drains |
| `-telemetry-interval` | `10s` | How often telemetry is published |
| `-fill-rate-min` | `1.5` | Min % added to fill per tick |
| `-fill-rate-max` | `3.5` | Max % added to fill per tick |
| `-battery-drain-min` | `0.1` | Min % drained from battery per tick |
| `-battery-drain-max` | `0.2` | Max % drained from battery per tick |
| `-control-addr` | `:8090` | Address for the runtime control server |

## Runtime control

A small HTTP server runs on `-control-addr` and lets you adjust parameters without restarting.

```bash
# View current config
curl http://localhost:8090/config

# Update any subset of parameters
curl -X PUT http://localhost:8090/config \
  -H "Content-Type: application/json" \
  -d '{"fillInterval":"2s","fillRateMin":5.0,"fillRateMax":10.0}'
```

Duration fields use Go duration strings (`"500ms"`, `"2s"`, `"1m"`). Changes take effect on each device's next tick.

## Telemetry payload

Published to `waste/containers/{id}/telemetry` at the configured telemetry interval (QoS 0):

```json
{
  "containerId": "container-001",
  "fillLevel": 42.35,
  "batteryLevel": 91.20,
  "timestamp": "2026-05-05T12:00:00Z",
  "location": { "lat": 41.9981, "lng": 21.4254 }
}
```

Fill level and battery are updated on their own independent tickers. Telemetry always reflects the latest state at the moment it fires.

## Simulating a pickup

Send a command to a device's command topic. The device drops its fill level to ~15–25% residual and publishes an `"emptied"` event:

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

Restart the simulator for new devices to take effect.
