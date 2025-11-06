# ================================================================
# Quick Fix Script for POL1002 Policy Issue
# ================================================================
# User: new@example.com
# Policy: POL1002
# Issue: Policy not linked to customer
# ================================================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Document Processor - Policy Fix Tool" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will fix the POL1002 policy issue for new@example.com" -ForegroundColor Yellow
Write-Host ""

# Get MySQL credentials
$mysqlUser = Read-Host "Enter MySQL username (default: root)"
if ([string]::IsNullOrWhiteSpace($mysqlUser)) { $mysqlUser = "root" }

$mysqlPassword = Read-Host "Enter MySQL password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($mysqlPassword)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host ""
Write-Host "Choose an option:" -ForegroundColor Green
Write-Host "[1] Link POL1002 to your account (RECOMMENDED)" -ForegroundColor White
Write-Host "[2] Delete POL1002 completely" -ForegroundColor Yellow
Write-Host "[3] Just diagnose the issue" -ForegroundColor Cyan
Write-Host "[4] Exit" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Linking POL1002 to new@example.com..." -ForegroundColor Green
        
        $sql = @"
USE dbms_database;
SET @customer_id = (SELECT customer_id FROM customer WHERE email = 'new@example.com');
INSERT INTO customer_policy (customer_id, policy_id)
SELECT @customer_id, 'POL1002'
WHERE @customer_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM customer_policy WHERE customer_id = @customer_id AND policy_id = 'POL1002');
UPDATE policy SET status = 'ACTIVE' WHERE policy_id = 'POL1002';
SELECT 'SUCCESS!' as Status;
"@
        
        $sql | mysql -u $mysqlUser -p"$plainPassword" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "SUCCESS! POL1002 is now linked to your account." -ForegroundColor Green
            Write-Host ""
            Write-Host "Next steps:" -ForegroundColor Yellow
            Write-Host "1. Restart backend: Ctrl+C, then run 'node server.js'" -ForegroundColor White
            Write-Host "2. Refresh frontend: Press F5" -ForegroundColor White
            Write-Host "3. Try Document Processor again" -ForegroundColor White
        } else {
            Write-Host ""
            Write-Host "ERROR! Failed to link policy." -ForegroundColor Red
            Write-Host "See: database_scripts\link_policy.sql for manual fix" -ForegroundColor Yellow
        }
    }
    
    "2" {
        Write-Host ""
        Write-Host "WARNING: This will permanently delete POL1002!" -ForegroundColor Red
        $confirm = Read-Host "Are you sure? Type 'yes' to confirm"
        
        if ($confirm -eq "yes") {
            Write-Host "Deleting POL1002..." -ForegroundColor Yellow
            
            $sql = @"
USE dbms_database;
DELETE FROM customer_policy WHERE policy_id = 'POL1002';
DELETE FROM policy WHERE policy_id = 'POL1002';
SELECT 'SUCCESS!' as Status;
"@
            
            $sql | mysql -u $mysqlUser -p"$plainPassword" 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "SUCCESS! POL1002 has been deleted." -ForegroundColor Green
                Write-Host "Refresh the frontend to see the change." -ForegroundColor White
            } else {
                Write-Host ""
                Write-Host "ERROR! Failed to delete policy." -ForegroundColor Red
                Write-Host "It may be referenced by existing claims." -ForegroundColor Yellow
            }
        } else {
            Write-Host "Deletion cancelled." -ForegroundColor Yellow
        }
    }
    
    "3" {
        Write-Host ""
        Write-Host "Diagnosing the issue..." -ForegroundColor Cyan
        Write-Host ""
        
        Write-Host "1. Checking customer account..." -ForegroundColor Yellow
        "SELECT customer_id, name, email FROM customer WHERE email = 'new@example.com';" | 
            mysql -u $mysqlUser -p"$plainPassword" dbms_database -t
        
        Write-Host ""
        Write-Host "2. Checking POL1002 policy..." -ForegroundColor Yellow
        "SELECT policy_id, policy_type, status, premium_amount FROM policy WHERE policy_id = 'POL1002';" | 
            mysql -u $mysqlUser -p"$plainPassword" dbms_database -t
        
        Write-Host ""
        Write-Host "3. Checking if POL1002 is linked..." -ForegroundColor Yellow
        "SELECT cp.*, c.email FROM customer_policy cp JOIN customer c ON cp.customer_id = c.customer_id WHERE cp.policy_id = 'POL1002' AND c.email = 'new@example.com';" | 
            mysql -u $mysqlUser -p"$plainPassword" dbms_database -t
        
        Write-Host ""
        Write-Host "============================================" -ForegroundColor Cyan
        Write-Host "Diagnosis Complete" -ForegroundColor Cyan
        Write-Host "============================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "If query #3 returned NO ROWS, that's your problem!" -ForegroundColor Red
        Write-Host "Run this script again and choose Option 1 to fix it." -ForegroundColor Green
    }
    
    "4" {
        Write-Host "Exiting..." -ForegroundColor Gray
        exit
    }
    
    default {
        Write-Host "Invalid choice!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
