CREATE TABLE daily_fill_snapshots (
    id              BIGSERIAL PRIMARY KEY,
    container_id    VARCHAR(50)        NOT NULL REFERENCES containers(container_id) ON DELETE CASCADE,
    snapshot_date   DATE               NOT NULL,
    fill_level      DOUBLE PRECISION   NOT NULL,
    CONSTRAINT uq_container_date UNIQUE (container_id, snapshot_date)
);

CREATE INDEX idx_snapshots_container_date ON daily_fill_snapshots(container_id, snapshot_date);
