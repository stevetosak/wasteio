ALTER TABLE containers
    ADD COLUMN waste_type   VARCHAR(50),
    ADD COLUMN device_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN address      VARCHAR(255),
    ADD COLUMN capacity     INTEGER;