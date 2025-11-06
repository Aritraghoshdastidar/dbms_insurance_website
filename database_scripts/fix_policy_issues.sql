-- ================================================================
-- DOCUMENT PROCESSOR - Policy Setup Helper Script
-- ================================================================
-- Purpose: Fix common policy-related issues preventing auto-claim creation
-- Use this script if you get "Policy not linked" or "No active policies" errors
-- ================================================================

USE `dbms_database`;

-- ================================================================
-- STEP 1: IDENTIFY YOUR CUSTOMER ID
-- ================================================================
-- Replace 'your.email@example.com' with your actual email
SELECT customer_id, name, email 
FROM customer 
WHERE email = 'your.email@example.com';

-- Note: Copy your customer_id from the result above

-- ================================================================
-- STEP 2: CHECK YOUR CURRENT POLICIES
-- ================================================================
-- Replace 'YOUR_CUSTOMER_ID' with the customer_id from Step 1
SELECT 
    cp.customer_policy_id,
    cp.customer_id,
    cp.policy_id,
    p.policy_type,
    p.status,
    p.premium_amount,
    p.start_date,
    p.end_date
FROM customer_policy cp
LEFT JOIN policy p ON cp.policy_id = p.policy_id
WHERE cp.customer_id = 'YOUR_CUSTOMER_ID';

-- Expected: At least one row with status = 'ACTIVE'
-- If empty: You have no policies (go to STEP 3A)
-- If all inactive: You need to activate a policy (go to STEP 3B)

-- ================================================================
-- STEP 3A: ADD A NEW POLICY (If you have NO policies)
-- ================================================================

-- First, check available policies in the system
SELECT policy_id, policy_type, status, premium_amount 
FROM policy 
WHERE status = 'ACTIVE' 
LIMIT 10;

-- Option 1: Link to an existing active policy
-- Replace 'YOUR_CUSTOMER_ID' and 'POL1001' with actual values
INSERT INTO customer_policy (customer_id, policy_id)
VALUES ('YOUR_CUSTOMER_ID', 'POL1001');

-- Option 2: Create a new policy and link it
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
    'POL_CUSTOM_001',                    -- Unique policy ID
    'Comprehensive Health Insurance',    -- Policy type
    75000.00,                            -- Premium amount
    'ACTIVE',                            -- Status
    CURDATE(),                           -- Policy date
    CURDATE(),                           -- Start date
    DATE_ADD(CURDATE(), INTERVAL 1 YEAR), -- End date (1 year)
    500000.00                            -- Coverage amount
);

-- Then link it to your account
INSERT INTO customer_policy (customer_id, policy_id)
VALUES ('YOUR_CUSTOMER_ID', 'POL_CUSTOM_001');

-- ================================================================
-- STEP 3B: ACTIVATE AN EXISTING POLICY
-- ================================================================
-- If you have policies but they're all inactive/expired

-- Check your specific policy status
SELECT policy_id, status, start_date, end_date 
FROM policy 
WHERE policy_id IN (
    SELECT policy_id FROM customer_policy WHERE customer_id = 'YOUR_CUSTOMER_ID'
);

-- Activate a specific policy
UPDATE policy 
SET status = 'ACTIVE',
    start_date = CURDATE(),
    end_date = DATE_ADD(CURDATE(), INTERVAL 1 YEAR)
WHERE policy_id = 'YOUR_POLICY_ID';

-- ================================================================
-- STEP 4: VERIFY THE FIX
-- ================================================================
-- This should now return at least one ACTIVE policy
SELECT 
    cp.customer_id,
    cp.policy_id,
    p.policy_type,
    p.status,
    p.premium_amount,
    'Can be used for claims' as note
FROM customer_policy cp
JOIN policy p ON cp.policy_id = p.policy_id
WHERE cp.customer_id = 'YOUR_CUSTOMER_ID'
  AND p.status = 'ACTIVE';

-- Expected: At least 1 row returned
-- If yes: You can now use Document Processor auto-creation! ✅
-- If no: Review steps 2-3 again

-- ================================================================
-- STEP 5: TEST CLAIM CREATION
-- ================================================================
-- Try creating a test claim to verify everything works

-- First, get your active policy details
SET @customer_id = 'YOUR_CUSTOMER_ID';
SET @policy_id = (
    SELECT cp.policy_id 
    FROM customer_policy cp
    JOIN policy p ON cp.policy_id = p.policy_id
    WHERE cp.customer_id = @customer_id 
      AND p.status = 'ACTIVE'
    LIMIT 1
);

-- Display what will be used
SELECT 
    @customer_id as customer_id,
    @policy_id as policy_id,
    'This policy will be used for auto-creation' as note;

-- Optional: Create a test claim manually
SET @test_claim_id = CONCAT('CLM_TEST_', UNIX_TIMESTAMP());
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
    @policy_id,
    @customer_id,
    'Test claim for document processor verification',
    CURDATE(),
    'PENDING',
    1000.00,
    'Test claim created via SQL',
    'CLAIM_APPROVAL_V1',
    1
);

-- Verify test claim was created
SELECT * FROM claim WHERE claim_id = @test_claim_id;

-- If successful, delete the test claim
-- DELETE FROM claim WHERE claim_id = @test_claim_id;

-- ================================================================
-- COMMON SCENARIOS & FIXES
-- ================================================================

-- *** SCENARIO 1: Brand new user, no policies at all ***
-- Run this after registering a new account:

-- Replace these values:
SET @new_customer_id = 'YOUR_CUSTOMER_ID';
SET @policy_to_assign = 'POL1001'; -- Use existing policy

INSERT INTO customer_policy (customer_id, policy_id)
VALUES (@new_customer_id, @policy_to_assign);

UPDATE policy SET status = 'ACTIVE' WHERE policy_id = @policy_to_assign;

-- *** SCENARIO 2: All policies expired ***
-- Renew your policies:

UPDATE policy p
JOIN customer_policy cp ON p.policy_id = cp.policy_id
SET p.status = 'ACTIVE',
    p.start_date = CURDATE(),
    p.end_date = DATE_ADD(CURDATE(), INTERVAL 1 YEAR)
WHERE cp.customer_id = 'YOUR_CUSTOMER_ID'
  AND p.status IN ('EXPIRED', 'INACTIVE_AWAITING_PAYMENT');

-- *** SCENARIO 3: Policy exists but not linked to customer ***
-- Link existing active policy to your account:

-- Find available active policies
SELECT policy_id, policy_type, status FROM policy WHERE status = 'ACTIVE';

-- Link to your account
INSERT INTO customer_policy (customer_id, policy_id)
SELECT 'YOUR_CUSTOMER_ID', policy_id
FROM policy 
WHERE policy_id = 'POL1001'
  AND NOT EXISTS (
      SELECT 1 FROM customer_policy 
      WHERE customer_id = 'YOUR_CUSTOMER_ID' AND policy_id = 'POL1001'
  );

-- ================================================================
-- BULK FIX: Assign active policies to ALL customers without policies
-- ================================================================
-- USE WITH CAUTION - This is for development/testing only

-- See which customers have no policies
SELECT c.customer_id, c.name, c.email
FROM customer c
LEFT JOIN customer_policy cp ON c.customer_id = cp.customer_id
WHERE cp.customer_policy_id IS NULL;

-- Assign POL1001 to all customers without policies
INSERT INTO customer_policy (customer_id, policy_id)
SELECT c.customer_id, 'POL1001'
FROM customer c
LEFT JOIN customer_policy cp ON c.customer_id = cp.customer_id
WHERE cp.customer_policy_id IS NULL;

-- Make sure POL1001 is active
UPDATE policy SET status = 'ACTIVE' WHERE policy_id = 'POL1001';

-- ================================================================
-- DIAGNOSTIC QUERIES
-- ================================================================

-- Query 1: Find customers with no policies
SELECT c.customer_id, c.name, c.email, 'NO POLICIES' as issue
FROM customer c
LEFT JOIN customer_policy cp ON c.customer_id = cp.customer_id
WHERE cp.customer_policy_id IS NULL;

-- Query 2: Find customers with only inactive policies
SELECT DISTINCT c.customer_id, c.name, c.email, 'NO ACTIVE POLICIES' as issue
FROM customer c
JOIN customer_policy cp ON c.customer_id = cp.customer_id
JOIN policy p ON cp.policy_id = p.policy_id
WHERE c.customer_id NOT IN (
    SELECT cp2.customer_id
    FROM customer_policy cp2
    JOIN policy p2 ON cp2.policy_id = p2.policy_id
    WHERE p2.status = 'ACTIVE'
);

-- Query 3: Find orphaned customer_policy records (policy doesn't exist)
SELECT cp.*, 'ORPHANED - Policy does not exist' as issue
FROM customer_policy cp
LEFT JOIN policy p ON cp.policy_id = p.policy_id
WHERE p.policy_id IS NULL;

-- Query 4: Full customer-policy overview
SELECT 
    c.customer_id,
    c.name,
    c.email,
    COUNT(cp.customer_policy_id) as total_policies,
    SUM(CASE WHEN p.status = 'ACTIVE' THEN 1 ELSE 0 END) as active_policies,
    SUM(CASE WHEN p.status = 'EXPIRED' THEN 1 ELSE 0 END) as expired_policies,
    GROUP_CONCAT(CONCAT(p.policy_id, ':', p.status) SEPARATOR ', ') as policy_details
FROM customer c
LEFT JOIN customer_policy cp ON c.customer_id = cp.customer_id
LEFT JOIN policy p ON cp.policy_id = p.policy_id
GROUP BY c.customer_id, c.name, c.email
HAVING total_policies = 0 OR active_policies = 0
ORDER BY c.customer_id;

-- ================================================================
-- CLEANUP (Optional)
-- ================================================================

-- Remove test claims created during testing
-- DELETE FROM claim WHERE description LIKE 'Test claim%' OR description LIKE '%document processor verification%';

-- Remove duplicate customer_policy entries
-- DELETE cp1 FROM customer_policy cp1
-- INNER JOIN customer_policy cp2 
-- WHERE cp1.customer_policy_id > cp2.customer_policy_id 
--   AND cp1.customer_id = cp2.customer_id 
--   AND cp1.policy_id = cp2.policy_id;

-- ================================================================
-- FINAL VERIFICATION CHECKLIST
-- ================================================================

-- Run all these and make sure you get expected results:

-- ✓ You have a customer account
SELECT 'PASS' as status FROM customer WHERE customer_id = 'YOUR_CUSTOMER_ID';

-- ✓ You have at least one policy linked
SELECT 'PASS' as status FROM customer_policy WHERE customer_id = 'YOUR_CUSTOMER_ID' LIMIT 1;

-- ✓ At least one of your policies is ACTIVE
SELECT 'PASS' as status 
FROM customer_policy cp
JOIN policy p ON cp.policy_id = p.policy_id
WHERE cp.customer_id = 'YOUR_CUSTOMER_ID' AND p.status = 'ACTIVE'
LIMIT 1;

-- ✓ Policy hasn't expired
SELECT 'PASS' as status
FROM customer_policy cp
JOIN policy p ON cp.policy_id = p.policy_id
WHERE cp.customer_id = 'YOUR_CUSTOMER_ID' 
  AND p.status = 'ACTIVE'
  AND (p.end_date IS NULL OR p.end_date >= CURDATE())
LIMIT 1;

-- If all return 'PASS', you're ready to use Document Processor auto-creation! ✅

-- ================================================================
-- NOTES
-- ================================================================
-- 1. Always replace 'YOUR_CUSTOMER_ID' with your actual customer ID
-- 2. Always replace 'YOUR_POLICY_ID' with your actual policy ID
-- 3. Test in development environment first
-- 4. Backup your database before running UPDATE/DELETE queries
-- 5. Check foreign key constraints if you get errors
-- 6. Commit transactions after successful execution
-- ================================================================
