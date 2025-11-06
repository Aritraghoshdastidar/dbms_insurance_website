@echo off
echo ========================================
echo Applying Database Fixes
echo ========================================
echo.
echo This will fix:
echo   1. Duplicate reminder errors on claim status updates
echo   2. Update trigger to be idempotent (safe for repeated updates)
echo.
echo ----------------------------------------
echo.

REM Check if mysql command is available
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: MySQL command not found in PATH
    echo Please run the SQL manually in MySQL Workbench:
    echo   File: database_scripts\patch_triggers.sql
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

mysql -u %MYSQL_USER% -p %DB_NAME% < database_scripts\patch_triggers.sql

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS! Database triggers patched!
    echo ========================================
    echo.
    echo The duplicate reminder error is now fixed.
    echo You can update claim statuses multiple times without errors.
    echo.
    echo Restart your backend server to see the fix in action:
    echo   npm start
    echo.
) else (
    echo.
    echo ========================================
    echo ERROR: Could not apply patch
    echo ========================================
    echo.
    echo Please run the SQL manually:
    echo   database_scripts\patch_triggers.sql
    echo.
)

pause
