@echo off
echo ========================================
echo Adding Security Officer Admin
echo ========================================
echo.
echo This will create a Security Officer admin needed for final policy approvals.
echo.
echo Credentials:
echo   Email: security@example.com
echo   Password: security123
echo   Role: Security Officer
echo.
echo ----------------------------------------
echo.

REM Check if mysql command is available
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: MySQL command not found in PATH
    echo Please run the SQL manually in MySQL Workbench:
    echo   File: database_scripts\add_security_officer.sql
    echo.
    pause
    exit /b 1
)

echo Enter your MySQL user (usually 'root' or 'insurance_app'):
set /p MYSQL_USER=MySQL User: 

echo.
echo Enter the database name (press Enter for 'dbms_database'):
set /p DB_NAME=Database: 
if "%DB_NAME%"=="" set DB_NAME=dbms_database

echo.
echo Connecting to MySQL...
echo (You will be prompted for your MySQL password)
echo.

mysql -u %MYSQL_USER% -p %DB_NAME% < database_scripts\add_security_officer.sql

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS! Security Officer created!
    echo ========================================
    echo.
    echo You now have these admin accounts:
    echo.
    echo   1. Main Admin:
    echo      Email: admin@example.com
    echo      Password: admin
    echo      Role: System Admin
    echo.
    echo   2. Security Officer:
    echo      Email: security@example.com
    echo      Password: security123
    echo      Role: Security Officer
    echo.
    echo Policy Approval Workflow:
    echo   - Step 1 Initial: Use admin@example.com
    echo   - Step 2 Final: Use security@example.com
    echo   - Four-eyes check prevents same user from both approvals
    echo.
) else (
    echo.
    echo ========================================
    echo ERROR: Could not add Security Officer
    echo ========================================
    echo.
    echo Please run the SQL manually:
    echo   database_scripts\add_security_officer.sql
    echo.
)

pause
