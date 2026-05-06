-- Containers table to store waste container information
CREATE TABLE containers (
                            id SERIAL PRIMARY KEY,
                            container_id VARCHAR(50) UNIQUE NOT NULL,
                            location_lat DOUBLE PRECISION NOT NULL,
                            location_lng DOUBLE PRECISION NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Telemetry records table for IoT sensor data
CREATE TABLE telemetry (
                           id SERIAL PRIMARY KEY,
                           container_id VARCHAR(50) NOT NULL REFERENCES containers(container_id) ON DELETE CASCADE,
                           fill_level DOUBLE PRECISION NOT NULL,
                           battery_level DOUBLE PRECISION NOT NULL,
                           timestamp TIMESTAMP NOT NULL,
                           recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pickup events table
CREATE TABLE pickups (
                         id SERIAL PRIMARY KEY,
                         container_id VARCHAR(50) NOT NULL REFERENCES containers(container_id) ON DELETE CASCADE,
                         pickup_time TIMESTAMP NOT NULL,
                         fill_level_before DOUBLE PRECISION,
                         recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_telemetry_container_id ON telemetry(container_id);
CREATE INDEX idx_telemetry_timestamp ON telemetry(timestamp);
CREATE INDEX idx_pickups_container_id ON pickups(container_id);
CREATE INDEX idx_pickups_pickup_time ON pickups(pickup_time);