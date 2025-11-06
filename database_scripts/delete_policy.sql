-- ================================================================
-- Delete POL1002 completely
-- ================================================================
USE dbms_database;

-- Check if policy has any claims
SELECT 
    COUNT(*) as claim_count,
    CASE 
        WHEN COUNT(*) > 0 THEN 'WARNING: Cannot delete - has claims!'
        ELSE 'OK to delete'
    END as Status
FROM claim 
WHERE policy_id = 'POL1002';

-- Delete customer_policy links
DELETE FROM customer_policy WHERE policy_id = 'POL1002';
SELECT ROW_COUNT() as 'Customer links deleted';

-- Delete the policy
DELETE FROM policy WHERE policy_id = 'POL1002';
SELECT ROW_COUNT() as 'Policies deleted';

-- Verify deletion
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'SUCCESS - POL1002 deleted!'
        ELSE 'ERROR - POL1002 still exists'
    END as Result
FROM policy 
WHERE policy_id = 'POL1002';
