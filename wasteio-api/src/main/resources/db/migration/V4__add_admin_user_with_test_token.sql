INSERT INTO users (name, email, password, role) 
VALUES ('Admin User', 'admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36XQuvKO', 'ADMIN');

INSERT INTO registration_token (token, used, created_by_id) 
VALUES ('test-token-12345', false, 1);

/* inicijalen user za testiranje na auth */