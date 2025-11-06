-- ================================================================
-- 01 - CREATE DATABASE
-- ================================================================
-- Purpose: Initialize the insurance database
-- Usage: mysql -u root -p < 01_create_database.sql
-- ================================================================

-- Drop existing database if needed (CAUTION: This will delete all data!)
-- DROP DATABASE IF EXISTS `dbms_database`;

-- Create database with UTF-8 support
CREATE DATABASE IF NOT EXISTS `dbms_database` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_0900_ai_ci;

-- Select the database
USE `dbms_database`;

-- Display confirmation
SELECT 'Database dbms_database created successfully!' AS Status;
