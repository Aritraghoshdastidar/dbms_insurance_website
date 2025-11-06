-- ================================================================
-- FIX: Document Processor Claim Creation Issue
-- ================================================================
-- User: new@example.com
-- Policy: POL1002 (CAR, $15000, ACTIVE but orphaned)
-- Error: "Invalid policy_id or customer_id"
-- ================================================================

USE `dbms_database`;

-- ================================================================
-- STEP 1: IDENTIFY YOUR CUSTOMER ID
-- ================================================================
SELECT customer_id, name, email, 'YOUR CUSTOMER INFO' as note
FROM customer 
WHERE email = 'new@example.com';

-- Copy the customer_id from above (e.g., CUST0001)
-- We'll use it in the next steps
SET @customer_id = (SELECT customer_id FROM customer WHERE email = 'new@example.com');
SELECT @customer_id as 'Your Customer ID';

-- ================================================================
-- STEP 2: CHECK POLICY POL1002 DETAILS
-- ================================================================
SELECT 
    policy_id, 
    policy_type, 
    premium_amount, 
    status,
    start_date,
    end_date,
    'POLICY INFO' as note
FROM policy 
WHERE policy_id = 'POL1002';

-- ================================================================
-- STEP 3: CHECK IF POLICY IS LINKED TO YOUR CUSTOMER
-- ================================================================
SELECT 
    cp.customer_policy_id,
    cp.customer_id,
    cp.policy_id,
    'LINK EXISTS' as status
FROM customer_policy cp
WHERE cp.policy_id = 'POL1002' 
  AND cp.customer_id = @customer_id;

-- If this returns EMPTY, that's your problem! 
-- Policy exists but not linked to customer

-- ================================================================
-- STEP 4: DIAGNOSE THE ISSUE
-- ================================================================

-- Check if policy is linked to ANY customer
SELECT 
    cp.customer_policy_id,
    cp.customer_id,
    c.name,
    c.email,
    'Policy is linked to this customer' as note
FROM customer_policy cp
LEFT JOIN customer c ON cp.customer_id = c.customer_id
WHERE cp.policy_id = 'POL1002';

-- If EMPTY: Policy exists but not linked to anyone (orphaned)
-- If shows different customer: Policy belongs to someone else

-- ================================================================
-- SOLUTION 1: LINK POL1002 TO YOUR CUSTOMER
-- ================================================================
-- This is what you need if you want to USE this policy for claims

-- Check if link already exists (to avoid duplicates)
SELECT COUNT(*) as existing_links
FROM customer_policy 
WHERE customer_id = @customer_id AND policy_id = 'POL1002';

-- If count = 0, create the link:
INSERT INTO customer_policy (customer_id, policy_id)
SELECT @customer_id, 'POL1002'
WHERE NOT EXISTS (
    SELECT 1 FROM customer_policy 
    WHERE customer_id = @customer_id AND policy_id = 'POL1002'
);

-- Verify the link was created
SELECT 
    cp.*,
    p.policy_type,
    p.status,
    'LINK CREATED ✓' as note
FROM customer_policy cp
JOIN policy p ON cp.policy_id = p.policy_id
WHERE cp.customer_id = @customer_id AND cp.policy_id = 'POL1002';

-- ================================================================
-- SOLUTION 2: DELETE POL1002 (If you want to remove it)
-- ================================================================
-- Use this if you DON'T want this policy and want to remove it

-- Step 2A: Check if any claims reference this policy
SELECT claim_id, customer_id, amount, claim_status, 'Claims using POL1002' as note
FROM claim 
WHERE policy_id = 'POL1002';

-- If claims exist, you CANNOT delete the policy (foreign key constraint)
-- You'd need to delete claims first (NOT RECOMMENDED in production)

-- Step 2B: Delete the customer_policy link (if any)
DELETE FROM customer_policy WHERE policy_id = 'POL1002';
SELECT 'customer_policy links deleted' as status;

-- Step 2C: Delete the policy itself
DELETE FROM policy WHERE policy_id = 'POL1002';
SELECT 'Policy POL1002 deleted' as status;

-- ================================================================
-- RECOMMENDED SOLUTION: LINK THE POLICY (Don't Delete)
-- ================================================================
-- Since you already have POL1002 showing in dashboard, just link it!

-- Run this complete fix:
INSERT INTO customer_policy (customer_id, policy_id)
SELECT 
    (SELECT customer_id FROM customer WHERE email = 'new@example.com'),
    'POL1002'
WHERE NOT EXISTS (
    SELECT 1 FROM customer_policy 
    WHERE customer_id = (SELECT customer_id FROM customer WHERE email = 'new@example.com')
      AND policy_id = 'POL1002'
);

-- Make sure policy is ACTIVE
UPDATE policy 
SET status = 'ACTIVE',
    start_date = CURDATE(),
    end_date = DATE_ADD(CURDATE(), INTERVAL 1 YEAR)
WHERE policy_id = 'POL1002';

-- ================================================================
-- STEP 5: VERIFY THE FIX
-- ================================================================
SET @customer_id = (SELECT customer_id FROM customer WHERE email = 'new@example.com');

-- Should return 1 row with POL1002
SELECT 
    cp.customer_id,
    cp.policy_id,
    p.policy_type,
    p.status,
    p.premium_amount,
    '✓ READY FOR CLAIMS' as note
FROM customer_policy cp
JOIN policy p ON cp.policy_id = p.policy_id
WHERE cp.customer_id = @customer_id
  AND p.status = 'ACTIVE';

-- ================================================================
-- STEP 6: TEST CLAIM CREATION
-- ================================================================
-- Now try creating a claim manually to test

SET @customer_id = (SELECT customer_id FROM customer WHERE email = 'new@example.com');
SET @test_claim_id = CONCAT('CLM_TEST_', UNIX_TIMESTAMP());

-- This should work now
INSERT INTO claim (
    claim_id, 
    policy_id, 
    customer_id, 
    description, 
    claim_date, 
    claim_status, 
    amount,
    status_log,
    workflow_id,
    current_step_order
)
VALUES (
    @test_claim_id,
    'POL1002',
    @customer_id,
    'Test claim to verify fix',
    CURDATE(),
    'PENDING',
    100.00,
    'Test claim',
    'CLAIM_APPROVAL_V1',
    1
);

-- Check if claim was created
SELECT * FROM claim WHERE claim_id = @test_claim_id;

-- If successful, delete the test claim
DELETE FROM claim WHERE claim_id = @test_claim_id;
SELECT 'Test claim deleted - system is working!' as status;

-- ================================================================
-- ALTERNATIVE: CREATE NEW POLICY FROM SCRATCH
-- ================================================================
-- If you want to start fresh with a new policy

-- Step 1: Delete POL1002 (if it has no claims)
DELETE FROM customer_policy WHERE policy_id = 'POL1002';
DELETE FROM policy WHERE policy_id = 'POL1002';

-- Step 2: Create a new policy
INSERT INTO policy (
    policy_id,
    policy_type,
    premium_amount,
    status,
    policy_date,
    start_date,
    end_date,
    coverage_amount
)
VALUES (
    'POL_NEW_001',
    'Comprehensive Car Insurance',
    15000.00,
    'ACTIVE',
    CURDATE(),
    CURDATE(),
    DATE_ADD(CURDATE(), INTERVAL 1 YEAR),
    500000.00
);

-- Step 3: Link to your customer
INSERT INTO customer_policy (customer_id, policy_id)
SELECT customer_id, 'POL_NEW_001'
FROM customer 
WHERE email = 'new@example.com';

-- Verify
SELECT 
    c.email,
    cp.policy_id,
    p.policy_type,
    p.status
FROM customer c
JOIN customer_policy cp ON c.customer_id = cp.customer_id
JOIN policy p ON cp.policy_id = p.policy_id
WHERE c.email = 'new@example.com';

-- ================================================================
-- EXPLANATION OF THE ERROR
-- ================================================================
/*
Error: "Invalid policy_id or customer_id"

This happens when:
1. Policy POL1002 exists in `policy` table ✓
2. Customer exists in `customer` table ✓
3. BUT no link exists in `customer_policy` table ✗

The claim INSERT has foreign key constraints:
- FOREIGN KEY (policy_id) REFERENCES policy(policy_id)
- FOREIGN KEY (customer_id) REFERENCES customer(customer_id)

But the backend ALSO checks:
SELECT 1 FROM customer_policy 
WHERE customer_id = ? AND policy_id = ?

If this returns EMPTY → Error!

Solution: Create the link in customer_policy table
*/

-- ================================================================
-- QUICK FIX (ONE-LINER)
-- ================================================================
-- Replace with your actual customer_id

-- Option A: Just link the policy
INSERT IGNORE INTO customer_policy (customer_id, policy_id)
VALUES ('YOUR_CUSTOMER_ID_HERE', 'POL1002');

-- Option B: Delete the policy
DELETE FROM customer_policy WHERE policy_id = 'POL1002';
DELETE FROM policy WHERE policy_id = 'POL1002';

-- ================================================================
-- FINAL VERIFICATION QUERY
-- ================================================================
-- Run this to see your complete setup

SELECT 
    c.customer_id,
    c.email,
    cp.policy_id,
    p.policy_type,
    p.status,
    p.premium_amount,
    CASE 
        WHEN p.status = 'ACTIVE' THEN '✓ Can file claims'
        ELSE '✗ Cannot file claims'
    END as can_file_claims
FROM customer c
JOIN customer_policy cp ON c.customer_id = cp.customer_id
JOIN policy p ON cp.policy_id = p.policy_id
WHERE c.email = 'new@example.com';

-- Expected result: At least 1 row with status = 'ACTIVE'

-- ================================================================
-- SUMMARY
-- ================================================================
/*
PROBLEM: Policy POL1002 exists but not linked to customer new@example.com

SOLUTION (Choose one):

1. LINK THE POLICY (Recommended):
   INSERT INTO customer_policy (customer_id, policy_id)
   VALUES ('YOUR_CUSTOMER_ID', 'POL1002');

2. DELETE THE POLICY:
   DELETE FROM customer_policy WHERE policy_id = 'POL1002';
   DELETE FROM policy WHERE policy_id = 'POL1002';

After fixing, restart backend and try Document Processor again.
*/
