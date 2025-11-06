@echo off
REM ================================================================
REM Fix POL1002 Policy Issue for Document Processor
REM ================================================================
REM This script helps diagnose and fix the policy linking issue
REM User: new@example.com
REM Policy: POL1002
REM ================================================================

echo.
echo ========================================
echo Document Processor - Policy Fix Tool
echo ========================================
echo.
echo This will help you fix the POL1002 policy issue.
echo.
echo Options:
echo [1] Link POL1002 to your account (RECOMMENDED)
echo [2] Delete POL1002 policy completely
echo [3] Diagnose the issue only (no changes)
echo [4] Exit
echo.

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto LINK_POLICY
if "%choice%"=="2" goto DELETE_POLICY
if "%choice%"=="3" goto DIAGNOSE
if "%choice%"=="4" goto END

echo Invalid choice!
goto END

:LINK_POLICY
echo.
echo ========================================
echo OPTION 1: Linking POL1002 to your account
echo ========================================
echo.
echo This will connect POL1002 to new@example.com
echo so you can file claims with it.
echo.
pause

echo Running SQL commands...
mysql -u root -p dbms_database < link_policy.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS! POL1002 is now linked to your account.
    echo.
    echo Next steps:
    echo 1. Restart the backend server (Ctrl+C, then: node server.js)
    echo 2. Refresh the frontend (F5)
    echo 3. Try Document Processor again
    echo.
) else (
    echo.
    echo ERROR! Failed to link policy.
    echo Please run the SQL commands manually.
    echo See: database_scripts\fix_pol1002_issue.sql
    echo.
)
goto END

:DELETE_POLICY
echo.
echo ========================================
echo OPTION 2: Deleting POL1002
echo ========================================
echo.
echo WARNING: This will permanently delete POL1002!
echo.
set /p confirm="Are you sure? (yes/no): "

if /i not "%confirm%"=="yes" (
    echo Deletion cancelled.
    goto END
)

echo Running SQL commands...
mysql -u root -p dbms_database < delete_policy.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS! POL1002 has been deleted.
    echo.
    echo Next steps:
    echo 1. Restart the backend server
    echo 2. Refresh the frontend
    echo 3. Create a new policy from admin dashboard
    echo.
) else (
    echo.
    echo ERROR! Failed to delete policy.
    echo It may be referenced by existing claims.
    echo See: database_scripts\fix_pol1002_issue.sql
    echo.
)
goto END

:DIAGNOSE
echo.
echo ========================================
echo OPTION 3: Diagnosing the issue
echo ========================================
echo.
echo Checking your customer account...
mysql -u root -p -e "USE dbms_database; SELECT customer_id, name, email FROM customer WHERE email = 'new@example.com';"

echo.
echo Checking POL1002 policy...
mysql -u root -p -e "USE dbms_database; SELECT policy_id, policy_type, status, premium_amount FROM policy WHERE policy_id = 'POL1002';"

echo.
echo Checking if POL1002 is linked to new@example.com...
mysql -u root -p -e "USE dbms_database; SELECT cp.*, c.email FROM customer_policy cp JOIN customer c ON cp.customer_id = c.customer_id WHERE cp.policy_id = 'POL1002' AND c.email = 'new@example.com';"

echo.
echo ========================================
echo Diagnosis Complete
echo ========================================
echo.
echo If the last query returned NO ROWS, that's your problem!
echo Policy exists but not linked to your customer account.
echo.
echo Run this script again and choose Option 1 to fix it.
echo.
goto END

:END
echo.
pause
