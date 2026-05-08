INSERT INTO containers (name, container_id, latitude, longitude, latest_fill_level)
VALUES
    ('Container 001', 'container-001', 41.9981, 21.4254, 0.0),
    ('Container 002', 'container-002', 41.9965, 21.4301, 0.0),
    ('Container 003', 'container-003', 42.0012, 21.4189, 0.0)
ON CONFLICT (container_id) DO NOTHING;
