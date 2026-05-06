# CRUD For Container Devices
Backend service for managing smart waste containers using REST CRUD operations and real-time MQTT telemetry updates.

## Features

- REST API for container device management (CRUD)
- MQTT integration for real-time telemetry updates
- Automatic container fill level tracking
- Detection of container emptying events
- PostgreSQL database with Flyway migrations

## Running the Application
1. Start database

Make sure PostgreSQL is running and database is created:

- createdb wasteio

2. Run the application
   mvn spring-boot:run

## MQTT Integration

The system listens for telemetry data from IoT devices via MQTT.

## Input topic
- waste/containers/{deviceId}/telemetry

## Telemetry payload
{
"deviceId": "container-001",
"fillLevel": 78.5,
"batteryLevel": 92.3,
"timestamp": "2026-05-06T12:00:00Z",
"location": {
"lat": 41.9981,
"lng": 21.4254
}
}

## How it works
- MQTT message is received by MqttMessageHandler
- JSON payload is converted using ObjectMapper
- Device is fetched from database using repository
- Fill level is updated
- If fill level drops significantly, system detects container emptying event

## REST API
Method	Endpoint	            Description
GET	    /api/containers	        Get all containers
GET	    /api/containers/{id}	Get container by ID
POST	/api/containers	        Create new container
PUT	    /api/containers/{id}	Update container
DELETE	/api/containers/{id}	Delete container