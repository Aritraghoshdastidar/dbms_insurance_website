-- Add Security Officer admin for final policy approvals
-- This role is required for the four-eyes policy approval workflow

USE dbms_database;

-- Insert Security Officer admin
INSERT INTO administrator (admin_id, name, email, phone, role, password)
VALUES (
    'ADM_SECURITY',
    'Security Officer',
    'security@example.com',
    '9999888777',
    'Security Officer',
    '$2b$10$DVQJk8JJm95zLCUObxrTIO9tYrGHjxbgz.aoE8mjIci9rxAWWbThS'
)
ON DUPLICATE KEY UPDATE
    email = 'security@example.com',
    role = 'Security Officer',
    password = '$2b$10$DVQJk8JJm95zLCUObxrTIO9tYrGHjxbgz.aoE8mjIci9rxAWWbThS';

-- Also update ADM002 to have a proper role
UPDATE administrator 
SET role = 'Junior Adjuster'
WHERE admin_id = 'ADM002';

-- Verify all admins and their roles
SELECT admin_id, name, email, role, 
       CASE WHEN password IS NULL THEN 'NO PASSWORD' ELSE 'HAS PASSWORD' END as password_status
FROM administrator
ORDER BY admin_id;
