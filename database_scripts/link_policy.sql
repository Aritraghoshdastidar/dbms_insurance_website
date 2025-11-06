-- ================================================================
-- Link POL1002 to new@example.com
-- ================================================================
USE dbms_database;

-- Get customer ID
SET @customer_id = (SELECT customer_id FROM customer WHERE email = 'new@example.com');

-- Display customer info
SELECT @customer_id as 'Customer ID', 'Linking policy...' as Status;

-- Link policy to customer (avoid duplicates)
INSERT INTO customer_policy (customer_id, policy_id)
SELECT @customer_id, 'POL1002'
WHERE @customer_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM customer_policy 
      WHERE customer_id = @customer_id AND policy_id = 'POL1002'
  );

-- Make sure policy is ACTIVE
UPDATE policy 
SET status = 'ACTIVE',
    start_date = CURDATE(),
    end_date = DATE_ADD(CURDATE(), INTERVAL 1 YEAR)
WHERE policy_id = 'POL1002';

-- Verify the fix
SELECT 
    c.customer_id,
    c.email,
    cp.policy_id,
    p.policy_type,
    p.status,
    p.premium_amount,
    'SUCCESS - Policy linked!' as Result
FROM customer c
JOIN customer_policy cp ON c.customer_id = cp.customer_id
JOIN policy p ON cp.policy_id = p.policy_id
WHERE c.email = 'new@example.com' AND cp.policy_id = 'POL1002';
