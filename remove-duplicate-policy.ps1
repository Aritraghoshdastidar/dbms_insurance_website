# ================================================================
# Quick Fix: Remove Duplicate POL1002 Entry
# ================================================================
# This removes the duplicate POL1002 from "My Policies"
# while keeping the policy itself intact
# ================================================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Remove Duplicate POL1002 Policy" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will remove duplicate POL1002 entries" -ForegroundColor Yellow
Write-Host "from your 'My Policies' section." -ForegroundColor Yellow
Write-Host ""
Write-Host "The policy itself will remain in the system." -ForegroundColor Green
Write-Host ""

# Get MySQL credentials
$mysqlUser = Read-Host "Enter MySQL username (default: root)"
if ([string]::IsNullOrWhiteSpace($mysqlUser)) { $mysqlUser = "root" }

$mysqlPassword = Read-Host "Enter MySQL password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($mysqlPassword)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host ""
Write-Host "Checking for duplicates..." -ForegroundColor Yellow

# Check duplicates
$checkSql = @"
USE dbms_database;
SET @customer_id = (SELECT customer_id FROM customer WHERE email = 'new@example.com');
SELECT COUNT(*) as count FROM customer_policy WHERE customer_id = @customer_id AND policy_id = 'POL1002';
"@

$result = $checkSql | mysql -u $mysqlUser -p"$plainPassword" -N 2>&1 | Select-Object -Last 1

Write-Host "Found $result entries for POL1002" -ForegroundColor Cyan

if ([int]$result -gt 1) {
    Write-Host ""
    Write-Host "Removing duplicates..." -ForegroundColor Green
    
    $sql = @"
USE dbms_database;
SET @customer_id = (SELECT customer_id FROM customer WHERE email = 'new@example.com');
SET @keep_id = (SELECT MIN(customer_policy_id) FROM customer_policy WHERE customer_id = @customer_id AND policy_id = 'POL1002');
DELETE FROM customer_policy WHERE customer_id = @customer_id AND policy_id = 'POL1002' AND customer_policy_id != @keep_id;
SELECT 'SUCCESS!' as Status;
"@
    
    $sql | mysql -u $mysqlUser -p"$plainPassword" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "SUCCESS! Duplicate removed." -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Refresh your frontend (F5)" -ForegroundColor White
        Write-Host "2. Check 'My Policies' - should show POL1002 only once" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "ERROR! Failed to remove duplicate." -ForegroundColor Red
    }
} elseif ([int]$result -eq 1) {
    Write-Host ""
    Write-Host "No duplicates found! POL1002 appears only once." -ForegroundColor Green
    Write-Host "Your 'My Policies' should already be correct." -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "POL1002 not found for this customer." -ForegroundColor Yellow
    Write-Host "Run fix-policy-issue.ps1 to link it first." -ForegroundColor White
}

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
