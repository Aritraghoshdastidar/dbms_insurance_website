-- ================================================================
-- FIXED: Remove Duplicate POL1002 - All commands in one session
-- ================================================================
-- Run ALL these commands together in MySQL
-- ================================================================

USE dbms_database;

-- IMPORTANT: Set the customer_id variable first
SET @customer_id = (SELECT customer_id FROM customer WHERE email = 'new@example.com');

-- Verify the variable is set (should show your customer_id, NOT NULL)
SELECT @customer_id as 'Customer ID (must not be NULL)';

-- Check how many POL1002 entries exist for this customer
SELECT 
    customer_policy_id,
    customer_id,
    policy_id,
    'Current Entry' as note
FROM customer_policy
WHERE customer_id = @customer_id 
  AND policy_id = 'POL1002';

-- If above shows 2+ rows, run this to delete duplicates:
DELETE FROM customer_policy
WHERE customer_id = @customer_id 
  AND policy_id = 'POL1002'
  AND customer_policy_id NOT IN (
      SELECT * FROM (
          SELECT MIN(customer_policy_id) 
          FROM customer_policy 
          WHERE customer_id = @customer_id AND policy_id = 'POL1002'
      ) as temp
  );

-- Show how many rows were deleted
SELECT ROW_COUNT() as 'Rows Deleted';

-- Verify final result - should be 1
SELECT COUNT(*) as 'Remaining Entries (should be 1)' 
FROM customer_policy 
WHERE customer_id = @customer_id AND policy_id = 'POL1002';

-- Show the final entry
SELECT 
    customer_policy_id,
    customer_id,
    policy_id,
    'FINAL ENTRY' as note
FROM customer_policy
WHERE customer_id = @customer_id 
  AND policy_id = 'POL1002';
