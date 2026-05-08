INSERT INTO users (name, email, password, role)
-- password: password123
VALUES ('Admin User', 'admin@example.com', '$2a$10$cNSP4KztdRCwztXPv8ySueNQhw1RjfhTCVZ1lR17j9wCNmbdhCCRe', 'ADMIN');

INSERT INTO registration_token (token, used, created_by_id)
VALUES (
           'test-token-12345',
           false,
           (SELECT id FROM users WHERE email = 'admin@example.com')
       );
/* inicijalen user za testiranje na auth */