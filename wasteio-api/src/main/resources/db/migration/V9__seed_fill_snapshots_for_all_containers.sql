-- Seed daily fill snapshots for containers 004-020 so their history charts
-- are not empty. Each container gets 7 days of progressive fill data.

-- First, ensure containers 004-020 exist in the database (containers 001-003 already exist from V2)
INSERT INTO containers (name, container_id, latitude, longitude, latest_fill_level) VALUES
    ('Container 004', 'container-004', 41.9950, 21.4280, 0.0),
    ('Container 005', 'container-005', 42.0025, 21.4220, 0.0),
    ('Container 006', 'container-006', 41.9935, 21.4320, 0.0),
    ('Container 007', 'container-007', 42.0050, 21.4150, 0.0),
    ('Container 008', 'container-008', 41.9900, 21.4350, 0.0),
    ('Container 009', 'container-009', 42.0075, 21.4120, 0.0),
    ('Container 010', 'container-010', 41.9875, 21.4380, 0.0),
    ('Container 011', 'container-011', 42.0100, 21.4090, 0.0),
    ('Container 012', 'container-012', 41.9850, 21.4410, 0.0),
    ('Container 013', 'container-013', 42.0125, 21.4060, 0.0),
    ('Container 014', 'container-014', 41.9825, 21.4440, 0.0),
    ('Container 015', 'container-015', 42.0150, 21.4030, 0.0),
    ('Container 016', 'container-016', 41.9800, 21.4470, 0.0),
    ('Container 017', 'container-017', 42.0175, 21.4000, 0.0),
    ('Container 018', 'container-018', 41.9775, 21.4500, 0.0),
    ('Container 019', 'container-019', 42.0200, 21.3970, 0.0),
    ('Container 020', 'container-020', 41.9750, 21.4530, 0.0)
ON CONFLICT (container_id) DO NOTHING;

-- Now seed the daily fill snapshots for containers 004-020
INSERT INTO daily_fill_snapshots (container_id, snapshot_date, fill_level) VALUES
-- container-004: general, moderate traffic
('container-004', CURRENT_DATE - 6, 10.0),
('container-004', CURRENT_DATE - 5, 22.0),
('container-004', CURRENT_DATE - 4, 35.0),
('container-004', CURRENT_DATE - 3, 48.0),
('container-004', CURRENT_DATE - 2, 60.0),
('container-004', CURRENT_DATE - 1, 73.0),
('container-004', CURRENT_DATE,      85.0),

-- container-005: recycling, slower fill
('container-005', CURRENT_DATE - 6, 8.0),
('container-005', CURRENT_DATE - 5, 16.0),
('container-005', CURRENT_DATE - 4, 25.0),
('container-005', CURRENT_DATE - 3, 34.0),
('container-005', CURRENT_DATE - 2, 42.0),
('container-005', CURRENT_DATE - 1, 51.0),
('container-005', CURRENT_DATE,      60.0),

-- container-006: general, high traffic
('container-006', CURRENT_DATE - 6, 15.0),
('container-006', CURRENT_DATE - 5, 30.0),
('container-006', CURRENT_DATE - 4, 47.0),
('container-006', CURRENT_DATE - 3, 62.0),
('container-006', CURRENT_DATE - 2, 78.0),
('container-006', CURRENT_DATE - 1, 90.0),
('container-006', CURRENT_DATE,      14.0),

-- container-007: hazardous, very slow fill, recent pickup
('container-007', CURRENT_DATE - 6, 5.0),
('container-007', CURRENT_DATE - 5, 10.0),
('container-007', CURRENT_DATE - 4, 15.0),
('container-007', CURRENT_DATE - 3, 20.0),
('container-007', CURRENT_DATE - 2, 26.0),
('container-007', CURRENT_DATE - 1, 32.0),
('container-007', CURRENT_DATE,      8.0),

-- container-008: general, steady
('container-008', CURRENT_DATE - 6, 12.0),
('container-008', CURRENT_DATE - 5, 25.0),
('container-008', CURRENT_DATE - 4, 38.0),
('container-008', CURRENT_DATE - 3, 50.0),
('container-008', CURRENT_DATE - 2, 63.0),
('container-008', CURRENT_DATE - 1, 75.0),
('container-008', CURRENT_DATE,      88.0),

-- container-009: organic, fast fill
('container-009', CURRENT_DATE - 6, 20.0),
('container-009', CURRENT_DATE - 5, 40.0),
('container-009', CURRENT_DATE - 4, 58.0),
('container-009', CURRENT_DATE - 3, 76.0),
('container-009', CURRENT_DATE - 2, 92.0),
('container-009', CURRENT_DATE - 1, 18.0),
('container-009', CURRENT_DATE,      36.0),

-- container-010: recycling, steady
('container-010', CURRENT_DATE - 6, 7.0),
('container-010', CURRENT_DATE - 5, 15.0),
('container-010', CURRENT_DATE - 4, 22.0),
('container-010', CURRENT_DATE - 3, 30.0),
('container-010', CURRENT_DATE - 2, 38.0),
('container-010', CURRENT_DATE - 1, 46.0),
('container-010', CURRENT_DATE,      55.0),

-- container-011: general, high traffic
('container-011', CURRENT_DATE - 6, 18.0),
('container-011', CURRENT_DATE - 5, 34.0),
('container-011', CURRENT_DATE - 4, 50.0),
('container-011', CURRENT_DATE - 3, 66.0),
('container-011', CURRENT_DATE - 2, 80.0),
('container-011', CURRENT_DATE - 1, 93.0),
('container-011', CURRENT_DATE,      11.0),

-- container-012: general, moderate
('container-012', CURRENT_DATE - 6, 9.0),
('container-012', CURRENT_DATE - 5, 20.0),
('container-012', CURRENT_DATE - 4, 32.0),
('container-012', CURRENT_DATE - 3, 44.0),
('container-012', CURRENT_DATE - 2, 55.0),
('container-012', CURRENT_DATE - 1, 67.0),
('container-012', CURRENT_DATE,      78.0),

-- container-013: recycling, slow
('container-013', CURRENT_DATE - 6, 6.0),
('container-013', CURRENT_DATE - 5, 12.0),
('container-013', CURRENT_DATE - 4, 19.0),
('container-013', CURRENT_DATE - 3, 26.0),
('container-013', CURRENT_DATE - 2, 33.0),
('container-013', CURRENT_DATE - 1, 40.0),
('container-013', CURRENT_DATE,      48.0),

-- container-014: general, large capacity, moderate fill
('container-014', CURRENT_DATE - 6, 8.0),
('container-014', CURRENT_DATE - 5, 16.0),
('container-014', CURRENT_DATE - 4, 25.0),
('container-014', CURRENT_DATE - 3, 33.0),
('container-014', CURRENT_DATE - 2, 42.0),
('container-014', CURRENT_DATE - 1, 50.0),
('container-014', CURRENT_DATE,      58.0),

-- container-015: hazardous, very slow
('container-015', CURRENT_DATE - 6, 4.0),
('container-015', CURRENT_DATE - 5, 8.0),
('container-015', CURRENT_DATE - 4, 12.0),
('container-015', CURRENT_DATE - 3, 16.0),
('container-015', CURRENT_DATE - 2, 20.0),
('container-015', CURRENT_DATE - 1, 25.0),
('container-015', CURRENT_DATE,      30.0),

-- container-016: general, busy area
('container-016', CURRENT_DATE - 6, 14.0),
('container-016', CURRENT_DATE - 5, 28.0),
('container-016', CURRENT_DATE - 4, 42.0),
('container-016', CURRENT_DATE - 3, 56.0),
('container-016', CURRENT_DATE - 2, 70.0),
('container-016', CURRENT_DATE - 1, 84.0),
('container-016', CURRENT_DATE,      96.0),

-- container-017: organic, fast fill with pickup
('container-017', CURRENT_DATE - 6, 22.0),
('container-017', CURRENT_DATE - 5, 44.0),
('container-017', CURRENT_DATE - 4, 65.0),
('container-017', CURRENT_DATE - 3, 85.0),
('container-017', CURRENT_DATE - 2, 12.0),
('container-017', CURRENT_DATE - 1, 32.0),
('container-017', CURRENT_DATE,      52.0),

-- container-018: general, light traffic
('container-018', CURRENT_DATE - 6, 6.0),
('container-018', CURRENT_DATE - 5, 13.0),
('container-018', CURRENT_DATE - 4, 20.0),
('container-018', CURRENT_DATE - 3, 28.0),
('container-018', CURRENT_DATE - 2, 36.0),
('container-018', CURRENT_DATE - 1, 44.0),
('container-018', CURRENT_DATE,      52.0),

-- container-019: general, remote area
('container-019', CURRENT_DATE - 6, 5.0),
('container-019', CURRENT_DATE - 5, 11.0),
('container-019', CURRENT_DATE - 4, 17.0),
('container-019', CURRENT_DATE - 3, 23.0),
('container-019', CURRENT_DATE - 2, 30.0),
('container-019', CURRENT_DATE - 1, 36.0),
('container-019', CURRENT_DATE,      42.0),

-- container-020: recycling, steady moderate
('container-020', CURRENT_DATE - 6, 10.0),
('container-020', CURRENT_DATE - 5, 18.0),
('container-020', CURRENT_DATE - 4, 27.0),
('container-020', CURRENT_DATE - 3, 36.0),
('container-020', CURRENT_DATE - 2, 45.0),
('container-020', CURRENT_DATE - 1, 54.0),
('container-020', CURRENT_DATE,      63.0)

ON CONFLICT (container_id, snapshot_date) DO NOTHING;
