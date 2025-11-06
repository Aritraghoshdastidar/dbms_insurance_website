-- ================================================================
-- 06 - CRUD OPERATIONS EXAMPLES
-- ================================================================
-- Purpose: Show all CRUD operations used in the application
-- Note: These are reference queries with parameter placeholders
-- ================================================================

USE `dbms_database`;

-- ================================================================
-- CREATE OPERATIONS
-- ================================================================

-- CREATE 1: Register New Customer
INSERT INTO customer (
    customer_id, 
    name, 
    email, 
    phone, 
    address, 
    dob, 
    gender, 
    password
) VALUES (
    'CUST_NEW001',              -- Generated ID
    'Jane Smith',               -- Name
    'jane.smith@email.com',     -- Email
    '9876543210',               -- Phone
    '123 Main Street',          -- Address
    '1990-05-15',               -- Date of Birth
    'Female',                   -- Gender
    '$2b$10$hashed_password'    -- Bcrypt hashed password
);

-- CREATE 2: File New Claim
INSERT INTO claim (
    claim_id, 
    claim_amount, 
    claim_status, 
    claim_date, 
    customer_id, 
    policy_id, 
    description
) VALUES (
    'CLM_NEW001',               -- Generated claim ID
    50000.00,                   -- Claim amount
    'PENDING',                  -- Initial status
    NOW(),                      -- Current timestamp
    'CUST001',                  -- Customer ID
    'POL0001',                  -- Policy ID
    'Medical emergency claim'   -- Description
);

-- CREATE 3: Create New Workflow
INSERT INTO workflows (
    workflow_id, 
    workflow_name, 
    description, 
    created_at
) VALUES (
    'WF_NEW001',
    'Emergency Claim Workflow',
    'Fast-track workflow for emergency claims',
    NOW()
);

-- CREATE 4: Add Workflow Step
INSERT INTO workflow_steps (
    workflow_id, 
    step_number, 
    step_name, 
    step_type, 
    configuration, 
    status
) VALUES (
    'WF_NEW001',
    1,
    'Urgent Review',
    'MANUAL',
    '{"role": "emergency_adjuster", "sla_hours": 2}',
    'PENDING'
);

-- CREATE 5: Create Policy (with customer assignment)
INSERT INTO policy (
    policy_id, 
    policy_type, 
    coverage_amount, 
    premium_amount, 
    start_date, 
    end_date, 
    status
) VALUES (
    'POL_NEW001',
    'Travel Insurance',
    200000.00,
    5000.00,
    '2024-06-01',
    '2025-06-01',
    'PENDING_INITIAL_APPROVAL'
);

-- Link customer to policy
INSERT INTO customer_policy (customer_id, policy_id)
VALUES ('CUST001', 'POL_NEW001');

-- ================================================================
-- READ OPERATIONS
-- ================================================================

-- READ 1: Get Customer's Policies
SELECT 
    p.policy_id,
    p.policy_type,
    p.coverage_amount,
    p.premium_amount,
    p.start_date,
    p.end_date,
    p.status
FROM policy p
JOIN customer_policy cp ON p.policy_id = cp.policy_id
WHERE cp.customer_id = 'CUST001'
ORDER BY p.start_date DESC;

-- READ 2: Get Customer's Claims
SELECT 
    c.claim_id,
    c.claim_amount,
    c.claim_status,
    c.claim_date,
    c.description,
    p.policy_type,
    p.coverage_amount
FROM claim c
JOIN policy p ON c.policy_id = p.policy_id
WHERE c.customer_id = 'CUST001'
ORDER BY c.claim_date DESC;

-- READ 3: Get Pending Claims (Admin View)
SELECT 
    c.claim_id,
    c.claim_amount,
    c.claim_status,
    c.claim_date,
    c.description,
    cu.name AS customer_name,
    p.policy_type
FROM claim c
JOIN customer cu ON c.customer_id = cu.customer_id
JOIN policy p ON c.policy_id = p.policy_id
WHERE c.claim_status = 'PENDING'
ORDER BY c.claim_date ASC;

-- READ 4: Get Pending Policies (Admin View)
SELECT 
    p.policy_id,
    p.policy_type,
    p.coverage_amount,
    p.premium_amount,
    p.status,
    p.initial_approval_by,
    p.final_approval_by,
    cu.name AS customer_name,
    cu.email AS customer_email
FROM policy p
JOIN customer_policy cp ON p.policy_id = cp.policy_id
JOIN customer cu ON cp.customer_id = cu.customer_id
WHERE p.status IN ('PENDING_INITIAL_APPROVAL', 'PENDING_FINAL_APPROVAL')
ORDER BY p.policy_id DESC;

-- READ 5: Get Single Workflow with Steps
SELECT 
    w.workflow_id,
    w.workflow_name,
    w.description,
    ws.step_id,
    ws.step_number,
    ws.step_name,
    ws.step_type,
    ws.configuration
FROM workflows w
LEFT JOIN workflow_steps ws ON w.workflow_id = ws.workflow_id
WHERE w.workflow_id = 'WF_CLAIM_STANDARD'
ORDER BY ws.step_number;

-- READ 6: Get High-Risk Alerts
SELECT 
    c.claim_id,
    c.claim_amount,
    c.risk_score,
    c.claim_status,
    cu.name AS customer_name,
    p.policy_type
FROM claim c
JOIN customer cu ON c.customer_id = cu.customer_id
JOIN policy p ON c.policy_id = p.policy_id
WHERE c.claim_amount > 1000000 OR c.risk_score > 8
ORDER BY c.claim_date DESC;

-- ================================================================
-- UPDATE OPERATIONS
-- ================================================================

-- UPDATE 1: Approve Claim
UPDATE claim
SET 
    claim_status = 'APPROVED',
    assigned_to = 'ADM002'
WHERE claim_id = 'CLM001';

-- UPDATE 2: Decline Claim
UPDATE claim
SET 
    claim_status = 'DECLINED',
    assigned_to = 'ADM001'
WHERE claim_id = 'CLM002';

-- UPDATE 3: Initial Policy Approval
UPDATE policy
SET 
    status = 'PENDING_FINAL_APPROVAL',
    initial_approval_by = 'ADM001',
    initial_approval_date = NOW()
WHERE policy_id = 'POL_NEW001';

-- UPDATE 4: Final Policy Approval (Security Officer)
UPDATE policy
SET 
    status = 'INACTIVE_AWAITING_PAYMENT',
    final_approval_by = 'ADM_SECURITY',
    final_approval_date = NOW()
WHERE policy_id = 'POL_NEW001';

-- UPDATE 5: Activate Policy After Payment
UPDATE policy
SET status = 'ACTIVE'
WHERE policy_id = 'POL_NEW001';

-- UPDATE 6: Update Customer Profile
UPDATE customer
SET 
    phone = '9999888877',
    address = '456 New Street, New City'
WHERE customer_id = 'CUST001';

-- UPDATE 7: Update Workflow
UPDATE workflows
SET 
    workflow_name = 'Updated Workflow Name',
    description = 'Updated description'
WHERE workflow_id = 'WF_NEW001';

-- UPDATE 8: Update Workflow Step
UPDATE workflow_steps
SET 
    step_name = 'Updated Step Name',
    configuration = '{"role": "senior_adjuster", "updated": true}'
WHERE step_id = 1;

-- UPDATE 9: Mark Notification as Read
UPDATE reminder
SET status = 'READ'
WHERE notification_id = 'NOTIF_CLM_001_STATUS';

-- UPDATE 10: Update Claim Processing Time
UPDATE claim
SET processing_time = TIMESTAMPDIFF(HOUR, claim_date, NOW())
WHERE claim_id = 'CLM001' AND claim_status = 'APPROVED';

-- ================================================================
-- DELETE OPERATIONS
-- ================================================================

-- DELETE 1: Delete Workflow Step
DELETE FROM workflow_steps
WHERE step_id = 10;

-- DELETE 2: Delete Workflow (cascades to steps)
DELETE FROM workflows
WHERE workflow_id = 'WF_OLD001';

-- DELETE 3: Remove Policy-Agent Assignment
DELETE FROM agent_policy
WHERE agent_policy_id = 5;

-- DELETE 4: Remove Old Notifications
DELETE FROM reminder
WHERE 
    status = 'READ' 
    AND notification_date < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- DELETE 5: Remove Declined Claims (cleanup)
-- Note: Be careful with this - keep for audit purposes
DELETE FROM claim
WHERE 
    claim_status = 'DECLINED' 
    AND claim_date < DATE_SUB(NOW(), INTERVAL 2 YEAR);

-- ================================================================
-- TRANSACTION EXAMPLES (Complex CRUD)
-- ================================================================

-- TRANSACTION 1: Create Policy with Customer Assignment
START TRANSACTION;

INSERT INTO policy (policy_id, policy_type, coverage_amount, premium_amount, start_date, end_date, status)
VALUES ('POL_TRANS001', 'Life Insurance', 1000000.00, 30000.00, '2024-06-01', '2034-06-01', 'PENDING_INITIAL_APPROVAL');

INSERT INTO customer_policy (customer_id, policy_id)
VALUES ('CUST001', 'POL_TRANS001');

INSERT INTO audit_log (user_id, user_type, action_type, entity_id, details)
VALUES ('CUST001', 'CUSTOMER', 'POLICY_CREATED', 'POL_TRANS001', '{"policy_type": "Life Insurance"}');

COMMIT;

-- TRANSACTION 2: Process Payment and Activate Policy
START TRANSACTION;

INSERT INTO payment (payment_id, customer_policy_id, status, payment_date, payment_mode)
VALUES ('PAY001', 1, 'SUCCESS', NOW(), 'CREDIT_CARD');

UPDATE policy
SET status = 'ACTIVE'
WHERE policy_id = (
    SELECT policy_id 
    FROM customer_policy 
    WHERE customer_policy_id = 1
);

INSERT INTO reminder (notification_id, notification_date, status, message, type, customer_id)
VALUES ('NOTIF_PAY001', NOW(), 'PENDING', 'Payment successful! Policy activated.', 'PAYMENT_SUCCESS', 'CUST001');

COMMIT;

-- End of CRUD operations
SELECT 'CRUD operation examples created successfully!' AS Status;
