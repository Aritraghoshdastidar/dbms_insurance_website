-- ================================================================
-- Remove Duplicate POL1002 from customer_policy table
-- ================================================================
-- Issue: POL1002 appears twice in "My Policies" 
-- Cause: Multiple entries in customer_policy table
-- Solution: Keep one link, remove duplicates
-- ================================================================

USE dbms_database;

-- Step 1: Find customer ID for new@example.com
SET @customer_id = (SELECT customer_id FROM customer WHERE email = 'new@example.com');

-- Step 2: Check current duplicate entries
SELECT 
    customer_policy_id,
    customer_id,
    policy_id,
    'DUPLICATE ENTRY' as note
FROM customer_policy
WHERE customer_id = @customer_id 
  AND policy_id = 'POL1002'
ORDER BY customer_policy_id;

-- This should show 2 rows with the same customer_id and policy_id

-- Step 3: Keep the FIRST entry, delete the rest
-- Get the ID of the first entry to keep
SET @keep_id = (
    SELECT MIN(customer_policy_id)
    FROM customer_policy
    WHERE customer_id = @customer_id AND policy_id = 'POL1002'
);

-- Delete all OTHER entries
DELETE FROM customer_policy
WHERE customer_id = @customer_id 
  AND policy_id = 'POL1002'
  AND customer_policy_id != @keep_id;

SELECT CONCAT('Deleted ', ROW_COUNT(), ' duplicate entries') as Result;

-- Step 4: Verify - should now show only ONE entry
SELECT 
    customer_policy_id,
    customer_id,
    policy_id,
    'KEPT THIS ONE' as note
FROM customer_policy
WHERE customer_id = @customer_id 
  AND policy_id = 'POL1002';

-- Step 5: Verify in dashboard query format
SELECT 
    p.policy_id, 
    p.policy_type, 
    p.premium_amount, 
    p.status,
    COUNT(*) as appears_times
FROM policy p
JOIN customer_policy cp ON p.policy_id = cp.policy_id
WHERE cp.customer_id = @customer_id
GROUP BY p.policy_id, p.policy_type, p.premium_amount, p.status
HAVING COUNT(*) > 1;

-- If this returns EMPTY, all duplicates are removed! ✓
