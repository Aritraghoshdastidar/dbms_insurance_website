-- Add new admin user with email admin@example.com and password 'admin'
-- Run this in your MySQL client after importing the main database

USE dbms_database;

-- Insert new admin (or update if exists)
INSERT INTO administrator (admin_id, name, email, phone, role, password)
VALUES (
    'ADM_MAIN',
    'Main Administrator',
    'admin@example.com',
    '9999999999',
    'System Admin',
    '$2b$10$0LjN/okUr3S.6G8hNtYc7urAUWodXfojkSwkQg5/kDhGtpSx5g1dO'
)
ON DUPLICATE KEY UPDATE
    email = 'admin@example.com',
    password = '$2b$10$0LjN/okUr3S.6G8hNtYc7urAUWodXfojkSwkQg5/kDhGtpSx5g1dO';

-- Verify the admin was created
SELECT admin_id, name, email, role FROM administrator WHERE email = 'admin@example.com';
