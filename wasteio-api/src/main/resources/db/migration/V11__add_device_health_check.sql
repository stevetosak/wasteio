ALTER TABLE devices ADD COLUMN last_seen_at TIMESTAMP NULL;
UPDATE devices SET last_seen_at = created_at WHERE last_seen_at IS NULL;
ALTER TABLE devices ALTER COLUMN device_status SET DEFAULT 'IDLE';
