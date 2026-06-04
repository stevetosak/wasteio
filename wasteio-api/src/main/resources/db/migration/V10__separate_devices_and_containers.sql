ALTER TABLE containers DROP COLUMN device_status;

CREATE TABLE devices (
    device_id           VARCHAR(100) PRIMARY KEY,
    container_id        VARCHAR(100) REFERENCES containers(container_id) ON DELETE SET NULL,
    device_status       VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    mqtt_password_hash  VARCHAR(255),
    registration_status VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    registered_at       TIMESTAMP
);

INSERT INTO devices (device_id, container_id, device_status)
SELECT container_id, container_id, 'ACTIVE'
FROM containers;

CREATE TABLE device_registration_tokens (
    device_id     VARCHAR(100) PRIMARY KEY REFERENCES devices(device_id) ON DELETE CASCADE,
    token_hash    VARCHAR(255) NOT NULL,
    used          BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    registered_at TIMESTAMP
);