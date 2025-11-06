@echo off
echo ========================================
echo Adding Admin User to Database
echo ========================================
echo.
echo Admin Credentials:
echo   Email: admin@example.com
echo   Password: admin
echo.
echo ----------------------------------------
echo.

REM Check if mysql command is available
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: MySQL command not found in PATH
    echo Please install MySQL or add it to your PATH
    echo.
    echo Alternatively, run the SQL file manually in MySQL Workbench:
    echo   File: database_scripts\add_admin_user.sql
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

mysql -u %MYSQL_USER% -p %DB_NAME% < database_scripts\add_admin_user.sql

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS! Admin user created!
    echo ========================================
    echo.
    echo You can now login with:
    echo   Email: admin@example.com
    echo   Password: admin
    echo.
    echo Start the application:
    echo   1. Backend: npm start
    echo   2. Frontend: cd insurance-frontend ^&^& npm start
    echo   3. Open: http://localhost:3000
    echo   4. Check "Login as Admin" and use the credentials above
    echo.
) else (
    echo.
    echo ========================================
    echo ERROR: Could not add admin user
    echo ========================================
    echo.
    echo Please check:
    echo   1. MySQL is running
    echo   2. Database 'dbms_database' exists
    echo   3. Correct MySQL credentials
    echo.
    echo Or run the SQL manually from:
    echo   database_scripts\add_admin_user.sql
    echo.
)

pause
