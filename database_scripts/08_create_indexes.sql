-- ================================================================
-- 08 - INDEXES FOR PERFORMANCE
-- ================================================================
-- Purpose: Create indexes to optimize query performance
-- Dependencies: 02_create_tables.sql must be run first
-- ================================================================

USE `dbms_database`;

-- ================================================================
-- INDEXES ON FOREIGN KEYS (Already created with FOREIGN KEY constraints)
-- These are automatically created by MySQL, listed here for reference
-- ================================================================

-- customer_policy table
-- INDEX on customer_id (fk_cp_customer)
-- INDEX on policy_id (fk_cp_policy)

-- agent_policy table
-- INDEX on agent_id (fk_ap_agent)
-- INDEX on policy_id (fk_ap_policy)

-- claim table
-- INDEX on customer_id (fk_claim_customer)
-- INDEX on policy_id (fk_claim_policy)
-- INDEX on assigned_to (fk_claim_admin)

-- ================================================================
-- ADDITIONAL PERFORMANCE INDEXES
-- ================================================================

-- Index on claim status for pending claims queries
CREATE INDEX idx_claim_status ON claim(claim_status);

-- Index on claim date for sorting/filtering
CREATE INDEX idx_claim_date ON claim(claim_date DESC);

-- Index on policy status for filtering active/pending policies
CREATE INDEX idx_policy_status ON policy(status);

-- Index on policy dates for expiry checks
CREATE INDEX idx_policy_end_date ON policy(end_date);

-- Index on customer email for login queries
-- Already UNIQUE, no additional index needed

-- Index on administrator email for login queries
-- Already UNIQUE, no additional index needed

-- Index on reminder status and date for notification queries
CREATE INDEX idx_reminder_status_date ON reminder(status, notification_date);

-- Index on workflow_steps for workflow queries
CREATE INDEX idx_workflow_steps_workflow_id ON workflow_steps(workflow_id, step_number);

-- Index on audit_log for filtering by user
CREATE INDEX idx_audit_user ON audit_log(user_id, user_type, timestamp);

-- Composite index for high-risk claim queries
CREATE INDEX idx_claim_risk ON claim(claim_amount, risk_score);

-- Index for payment status queries
CREATE INDEX idx_payment_status ON payment(status, payment_date);

-- Display confirmation
SELECT 'Performance indexes created successfully!' AS Status;

-- Show all indexes
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX,
    INDEX_TYPE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'dbms_database'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;
