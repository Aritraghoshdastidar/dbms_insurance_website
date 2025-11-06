-- ================================================================
-- 05 - COMPLEX QUERIES
-- ================================================================
-- Purpose: Complex SQL queries used in the application
-- Note: These are reference queries showing the SQL logic
-- ================================================================

USE `dbms_database`;

-- ================================================================
-- QUERY 1: NESTED QUERY - High-Risk Claims Alert
-- Purpose: Find claims with high amounts or risk scores
-- Used in: HighRiskAlerts.js component
-- Endpoint: GET /api/alerts/highrisk
-- ================================================================

SELECT 
    c.claim_id,
    c.claim_amount,
    c.claim_status,
    c.claim_date,
    c.risk_score,
    c.description,
    cu.customer_id,
    cu.name AS customer_name,
    cu.email,
    p.policy_id,
    p.policy_type
FROM claim c
JOIN customer cu ON c.customer_id = cu.customer_id
JOIN policy p ON c.policy_id = p.policy_id
WHERE 
    c.claim_amount > 1000000  -- High-value claims
    OR c.risk_score > 8       -- High-risk score
ORDER BY c.claim_date DESC;

-- Alternative with subquery
SELECT * FROM claim
WHERE claim_id IN (
    SELECT claim_id 
    FROM claim 
    WHERE claim_amount > 1000000 OR risk_score > 8
)
ORDER BY claim_date DESC;

-- ================================================================
-- QUERY 2: JOIN QUERY - Customer Policies with Details
-- Purpose: Get all policies for a customer with full details
-- Used in: Dashboard.js component
-- Endpoint: GET /api/my-policies
-- ================================================================

SELECT 
    p.policy_id,
    p.policy_type,
    p.coverage_amount,
    p.premium_amount,
    p.start_date,
    p.end_date,
    p.status,
    cp.customer_policy_id,
    c.customer_id,
    c.name AS customer_name,
    c.email
FROM policy p
JOIN customer_policy cp ON p.policy_id = cp.policy_id
JOIN customer c ON cp.customer_id = c.customer_id
WHERE c.customer_id = 'CUST001'  -- Parameter from logged-in user
ORDER BY p.start_date DESC;

-- ================================================================
-- QUERY 3: MULTI-TABLE JOIN - Claims with Full Context
-- Purpose: Get claims with customer, policy, and assigned admin info
-- Used in: AdminDashboard.js component
-- Endpoint: GET /api/admin/pending-claims
-- ================================================================

SELECT 
    c.claim_id,
    c.claim_amount,
    c.claim_status,
    c.claim_date,
    c.description,
    c.risk_score,
    cu.customer_id,
    cu.name AS customer_name,
    cu.email AS customer_email,
    p.policy_id,
    p.policy_type,
    p.coverage_amount,
    a.admin_id,
    a.name AS assigned_admin,
    a.role AS admin_role
FROM claim c
JOIN customer cu ON c.customer_id = cu.customer_id
JOIN policy p ON c.policy_id = p.policy_id
LEFT JOIN administrator a ON c.assigned_to = a.admin_id
WHERE c.claim_status = 'PENDING'
ORDER BY c.claim_date DESC;

-- ================================================================
-- QUERY 4: AGGREGATE QUERY - Workflow Performance Metrics
-- Purpose: Calculate usage and average processing time per workflow
-- Used in: WorkflowMetricsDashboard.js component
-- Endpoint: GET /api/metrics/workflows
-- ================================================================

SELECT 
    w.workflow_id,
    w.workflow_name,
    COUNT(c.claim_id) AS usage_count,
    AVG(c.processing_time) AS avg_processing_time_hours,
    MIN(c.processing_time) AS min_processing_time,
    MAX(c.processing_time) AS max_processing_time,
    SUM(CASE WHEN c.claim_status = 'APPROVED' THEN 1 ELSE 0 END) AS approved_count,
    SUM(CASE WHEN c.claim_status = 'DECLINED' THEN 1 ELSE 0 END) AS declined_count
FROM workflows w
LEFT JOIN claim c ON w.workflow_id = c.workflow_id
GROUP BY w.workflow_id, w.workflow_name
HAVING COUNT(c.claim_id) > 0
ORDER BY usage_count DESC;

-- ================================================================
-- QUERY 5: AGGREGATE WITH HAVING - Overdue Tasks Report
-- Purpose: Find overdue workflow steps with counts
-- Used in: OverdueTasksReport.js component
-- Endpoint: GET /api/reports/overdue-tasks
-- ================================================================

SELECT 
    ws.workflow_id,
    w.workflow_name,
    ws.step_name,
    COUNT(*) AS overdue_count,
    AVG(DATEDIFF(NOW(), ws.due_date)) AS avg_overdue_days,
    MIN(ws.due_date) AS earliest_due_date,
    MAX(ws.due_date) AS latest_due_date
FROM workflow_steps ws
JOIN workflows w ON ws.workflow_id = w.workflow_id
WHERE 
    ws.status = 'PENDING' 
    AND ws.due_date < NOW()
GROUP BY ws.workflow_id, w.workflow_name, ws.step_name
HAVING COUNT(*) > 0
ORDER BY avg_overdue_days DESC;

-- ================================================================
-- QUERY 6: COMPLEX AGGREGATE - Policy Statistics by Type
-- Purpose: Analyze policy distribution and revenue
-- ================================================================

SELECT 
    p.policy_type,
    COUNT(DISTINCT p.policy_id) AS total_policies,
    COUNT(DISTINCT cp.customer_id) AS total_customers,
    SUM(p.coverage_amount) AS total_coverage,
    SUM(p.premium_amount) AS total_premium_revenue,
    AVG(p.premium_amount) AS avg_premium,
    COUNT(CASE WHEN p.status = 'ACTIVE' THEN 1 END) AS active_policies,
    COUNT(CASE WHEN p.status = 'PENDING_INITIAL_APPROVAL' THEN 1 END) AS pending_policies
FROM policy p
LEFT JOIN customer_policy cp ON p.policy_id = cp.policy_id
GROUP BY p.policy_type
ORDER BY total_premium_revenue DESC;

-- ================================================================
-- QUERY 7: NESTED SUBQUERY - Customers with Multiple Claims
-- Purpose: Find high-activity customers
-- ================================================================

SELECT 
    c.customer_id,
    c.name,
    c.email,
    (SELECT COUNT(*) 
     FROM claim cl 
     WHERE cl.customer_id = c.customer_id) AS total_claims,
    (SELECT SUM(cl.claim_amount) 
     FROM claim cl 
     WHERE cl.customer_id = c.customer_id) AS total_claimed_amount,
    (SELECT COUNT(*) 
     FROM claim cl 
     WHERE cl.customer_id = c.customer_id 
     AND cl.claim_status = 'APPROVED') AS approved_claims
FROM customer c
WHERE (SELECT COUNT(*) 
       FROM claim cl 
       WHERE cl.customer_id = c.customer_id) > 1
ORDER BY total_claims DESC;

-- ================================================================
-- QUERY 8: JOIN WITH AGGREGATE - Agent Performance
-- Purpose: Analyze agent workload and policy assignments
-- ================================================================

SELECT 
    a.agent_id,
    a.name AS agent_name,
    a.region,
    COUNT(DISTINCT ap.policy_id) AS assigned_policies,
    COUNT(DISTINCT cp.customer_id) AS unique_customers,
    SUM(p.coverage_amount) AS total_coverage_managed,
    AVG(p.premium_amount) AS avg_policy_premium
FROM agent a
LEFT JOIN agent_policy ap ON a.agent_id = ap.agent_id
LEFT JOIN policy p ON ap.policy_id = p.policy_id
LEFT JOIN customer_policy cp ON p.policy_id = cp.policy_id
GROUP BY a.agent_id, a.name, a.region
ORDER BY assigned_policies DESC;

-- ================================================================
-- QUERY 9: COMPLEX FILTER - Policies Requiring Renewal
-- Purpose: Find policies expiring within 30 days
-- ================================================================

SELECT 
    p.policy_id,
    p.policy_type,
    p.end_date,
    DATEDIFF(p.end_date, NOW()) AS days_until_expiry,
    c.customer_id,
    c.name AS customer_name,
    c.email AS customer_email,
    cp.customer_policy_id
FROM policy p
JOIN customer_policy cp ON p.policy_id = cp.policy_id
JOIN customer c ON cp.customer_id = c.customer_id
WHERE 
    p.status = 'ACTIVE'
    AND DATEDIFF(p.end_date, NOW()) BETWEEN 1 AND 30
ORDER BY days_until_expiry ASC;

-- ================================================================
-- QUERY 10: AGGREGATE WITH CASE - Claim Status Summary
-- Purpose: Dashboard statistics for admin
-- ================================================================

SELECT 
    COUNT(*) AS total_claims,
    SUM(claim_amount) AS total_claim_amount,
    AVG(claim_amount) AS avg_claim_amount,
    COUNT(CASE WHEN claim_status = 'PENDING' THEN 1 END) AS pending_claims,
    COUNT(CASE WHEN claim_status = 'APPROVED' THEN 1 END) AS approved_claims,
    COUNT(CASE WHEN claim_status = 'DECLINED' THEN 1 END) AS declined_claims,
    SUM(CASE WHEN claim_status = 'APPROVED' THEN claim_amount ELSE 0 END) AS approved_amount,
    AVG(CASE WHEN claim_status = 'APPROVED' THEN processing_time END) AS avg_approval_time
FROM claim
WHERE claim_date >= DATE_SUB(NOW(), INTERVAL 30 DAY);

-- End of complex queries
SELECT 'Complex query examples created successfully!' AS Status;
