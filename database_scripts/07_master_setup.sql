-- ================================================================
-- 07 - MASTER SETUP SCRIPT
-- ================================================================
-- Purpose: Run all setup scripts in correct order
-- Usage: mysql -u root -p < 07_master_setup.sql
-- ================================================================

-- Display banner
SELECT '
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     INSURANCE WORKFLOW AUTOMATION - DATABASE SETUP          ║
║                                                              ║
║     Team: Logicore (P04)                                    ║
║     Course: DBMS - Experiential Learning Level 2            ║
║     PESU - AIML Section B                                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
' AS '';

-- Step 1: Create Database
SELECT '>>> STEP 1/5: Creating database...' AS '';
SOURCE 01_create_database.sql;

-- Step 2: Create Tables
SELECT '>>> STEP 2/5: Creating tables...' AS '';
SOURCE 02_create_tables.sql;

-- Step 3: Create Triggers
SELECT '>>> STEP 3/5: Creating triggers...' AS '';
SOURCE 03_create_triggers.sql;

-- Step 4: Insert Seed Data
SELECT '>>> STEP 4/5: Inserting seed data...' AS '';
SOURCE 04_insert_seed_data.sql;

-- Step 5: Add Admin Users
SELECT '>>> STEP 5/5: Creating admin accounts...' AS '';
SOURCE add_admin_user.sql;
SOURCE add_security_officer.sql;

-- Final verification
SELECT '
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║                    SETUP COMPLETED!                          ║
║                                                              ║
║  Database: dbms_database                                     ║
║  Tables: 14                                                  ║
║  Triggers: 5                                                 ║
║  Admin Accounts: 3                                           ║
║                                                              ║
║  Next Steps:                                                 ║
║  1. Update .env file with database credentials              ║
║  2. Start backend: npm start                                ║
║  3. Start frontend: cd insurance-frontend && npm start      ║
║                                                              ║
║  Admin Logins:                                               ║
║  - admin@example.com / admin (System Admin)                 ║
║  - security@example.com / security123 (Security Officer)    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
' AS '';

-- Show database summary
USE dbms_database;

SELECT 
    'Database Summary' AS Info,
    '' AS '';

SELECT 
    (SELECT COUNT(*) FROM administrator) AS Administrators,
    (SELECT COUNT(*) FROM customer) AS Customers,
    (SELECT COUNT(*) FROM agent) AS Agents,
    (SELECT COUNT(*) FROM policy) AS Policies,
    (SELECT COUNT(*) FROM claim) AS Claims,
    (SELECT COUNT(*) FROM workflows) AS Workflows,
    (SELECT COUNT(*) FROM workflow_steps) AS Workflow_Steps;
