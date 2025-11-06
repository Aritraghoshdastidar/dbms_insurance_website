@echo off
echo ================================================
echo MySQL Connection Test Script
echo ================================================
echo.

REM Test if MySQL is accessible
echo Testing MySQL connection with current .env settings...
echo.

mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: MySQL command not found in PATH
    echo Please install MySQL or add it to your PATH
    echo.
    pause
    exit /b 1
)

echo MySQL client found!
echo.
echo Attempting to connect to MySQL...
echo (You will be prompted for your MySQL root password)
echo.

mysql -u root -p -e "SELECT VERSION(); SHOW DATABASES;"

if %errorlevel% equ 0 (
    echo.
    echo ================================================
    echo SUCCESS! MySQL connection works!
    echo ================================================
    echo.
    echo Now update your .env file:
    echo 1. Open .env in the project root
    echo 2. Set DB_PASSWORD to the password you just entered
    echo 3. Save the file
    echo 4. Run: npm start
    echo.
) else (
    echo.
    echo ================================================
    echo ERROR: Could not connect to MySQL
    echo ================================================
    echo.
    echo Possible issues:
    echo 1. Wrong password
    echo 2. MySQL service not running
    echo 3. MySQL not installed
    echo.
    echo See MYSQL_SETUP.md for detailed troubleshooting
    echo.
)

pause
