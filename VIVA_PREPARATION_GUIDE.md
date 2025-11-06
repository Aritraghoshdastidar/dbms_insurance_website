# 🎓 DBMS VIVA PREPARATION GUIDE
## Complete SQL Concepts with Code Examples & Frontend Mapping

---

## 📋 TABLE OF CONTENTS
1. [Database Creation](#1-database-creation)
2. [User Creation & Permissions](#2-user-creation--permissions)
3. [Triggers (5 Triggers)](#3-triggers-5-triggers)
4. [Stored Procedures & Functions](#4-stored-procedures--functions)
5. [CRUD Operations](#5-crud-operations)
6. [Nested Queries](#6-nested-queries)
7. [JOIN Queries](#7-join-queries)
8. [Aggregate Queries](#8-aggregate-queries)
9. [Frontend-Backend Mapping](#9-frontend-backend-mapping)

---

## 1. DATABASE CREATION

### 📁 File Location
`database_scripts/01_create_database.sql`

### 💻 SQL Code
```sql
CREATE DATABASE IF NOT EXISTS `dbms_database` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_0900_ai_ci;

USE dbms_database;
```

### 📝 Explanation
- Creates database with UTF-8 support for international characters
- Uses modern collation (utf8mb4_0900_ai_ci) for better sorting

---

## 2. USER CREATION & PERMISSIONS

### 📁 File Location
`database_scripts/add_admin_user.sql`

### 💻 SQL Code (User Insertion)
```sql
USE dbms_database;

-- Insert admin user with hashed password
INSERT INTO administrator (admin_id, name, email, phone, role, password)
VALUES (
    'ADM_MAIN',
    'Main Administrator',
    'admin@example.com',
    '9999999999',
    'System Admin',
    '$2b$10$0LjN/okUr3S.6G8hNtYc7urAUWodXfojkSwkQg5/kDhGtpSx5g1dO'
)
ON DUPLICATE KEY UPDATE
    email = 'admin@example.com',
    password = '$2b$10$0LjN/okUr3S.6G8hNtYc7urAUWodXfojkSwkQg5/kDhGtpSx5g1dO';
```

### 📝 Explanation
- Uses bcrypt hashing ($2b$10$) for secure password storage
- ON DUPLICATE KEY UPDATE prevents errors if user already exists
- Password: 'admin' (hashed)

### 🌐 Frontend Usage
- **File**: `insurance-frontend/src/components/RegistrationPage.js`
- **API**: `POST /api/register` (server.js line 367)
- **Code Location**: server.js line 389

```javascript
// Frontend: RegistrationPage.js
const response = await fetch('http://localhost:3001/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
});

// Backend: server.js line 389
const [result] = await connection.execute(
    `INSERT INTO customer (customer_id, name, email, password) 
     VALUES (?, ?, ?, ?)`,
    [customerId, name, email, hashedPassword]
);
```

---

## 3. TRIGGERS (5 TRIGGERS)

### 📁 File Location
`database_scripts/03_create_triggers.sql` (195 lines)

---

### ✅ TRIGGER 1: after_claim_status_update

### 💻 SQL Code
```sql
DELIMITER $$

CREATE TRIGGER after_claim_status_update
AFTER UPDATE ON claim
FOR EACH ROW
BEGIN
    IF OLD.claim_status != NEW.claim_status THEN
        INSERT INTO reminder_notification (
            notification_id, 
            customer_id, 
            notification_type, 
            message, 
            priority
        ) VALUES (
            CONCAT('NOT_', UUID_SHORT()),
            NEW.customer_id,
            'Claim Status Update',
            CONCAT('Your claim ', NEW.claim_id, ' status changed to ', NEW.claim_status),
            'HIGH'
        );
    END IF;
END$$

DELIMITER ;
```

### 📝 Explanation
- **Type**: AFTER UPDATE trigger
- **Purpose**: Automatically notifies customer when claim status changes
- **Business Logic**: Creates notification only if status actually changed (OLD != NEW)

### 🌐 Frontend Usage
- **File**: `insurance-frontend/src/components/AdminDashboard.js`
- **API**: `PUT /api/admin/claims/:claimId/status` (server.js line 1045)
- **When**: Admin approves/declines a claim

---

### ✅ TRIGGER 2: after_payment_success

### 💻 SQL Code
```sql
DELIMITER $$

CREATE TRIGGER after_payment_success
AFTER INSERT ON initial_payment
FOR EACH ROW
BEGIN
    IF NEW.payment_status = 'SUCCESS' THEN
        UPDATE policy 
        SET status = 'ACTIVE'
        WHERE policy_id = NEW.policy_id;
    END IF;
END$$

DELIMITER ;
```

### 📝 Explanation
- **Type**: AFTER INSERT trigger
- **Purpose**: Automatically activates policy when payment is successful
- **Business Logic**: Checks payment_status = 'SUCCESS' before activating

### 🌐 Frontend Usage
- **File**: `insurance-frontend/src/components/Dashboard.js`
- **API**: `POST /api/policies/:policyId/mock-activate` (server.js line 936)
- **When**: Customer makes payment for new policy

---

### ✅ TRIGGER 3: after_policy_insert

### 💻 SQL Code
```sql
DELIMITER $$

CREATE TRIGGER after_policy_insert
AFTER INSERT ON policy
FOR EACH ROW
BEGIN
    DECLARE customer_id_val VARCHAR(50);
    
    SELECT customer_id INTO customer_id_val
    FROM customer_policy
    WHERE policy_id = NEW.policy_id
    LIMIT 1;
    
    IF customer_id_val IS NOT NULL THEN
        INSERT INTO reminder_notification (
            notification_id,
            customer_id,
            notification_type,
            message,
            priority
        ) VALUES (
            CONCAT('NOT_', UUID_SHORT()),
            customer_id_val,
            'Policy Created',
            CONCAT('Welcome! Your new policy ', NEW.policy_id, ' has been created.'),
            'MEDIUM'
        );
    END IF;
END$$

DELIMITER ;
```

### 📝 Explanation
- **Type**: AFTER INSERT trigger
- **Purpose**: Sends welcome notification when new policy is created
- **Business Logic**: Looks up customer_id from customer_policy junction table

### 🌐 Frontend Usage
- **File**: `insurance-frontend/src/components/Dashboard.js`
- **API**: `POST /api/policies/purchase` (server.js line 884)
- **When**: Customer purchases new insurance policy

---

### ✅ TRIGGER 4: policy_renewal_reminder

### 💻 SQL Code
```sql
DELIMITER $$

CREATE TRIGGER policy_renewal_reminder
BEFORE UPDATE ON policy
FOR EACH ROW
BEGIN
    DECLARE customer_id_val VARCHAR(50);
    
    IF NEW.end_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) 
       AND NEW.status = 'ACTIVE'
       AND (OLD.end_date IS NULL OR OLD.end_date != NEW.end_date) THEN
        
        SELECT customer_id INTO customer_id_val
        FROM customer_policy
        WHERE policy_id = NEW.policy_id
        LIMIT 1;
        
        IF customer_id_val IS NOT NULL THEN
            INSERT INTO reminder_notification (
                notification_id,
                customer_id,
                notification_type,
                message,
                priority
            ) VALUES (
                CONCAT('NOT_', UUID_SHORT()),
                customer_id_val,
                'Policy Renewal Reminder',
                CONCAT('Your policy ', NEW.policy_id, ' will expire on ', NEW.end_date, '. Please renew soon.'),
                'HIGH'
            );
        END IF;
    END IF;
END$$

DELIMITER ;
```

### 📝 Explanation
- **Type**: BEFORE UPDATE trigger
- **Purpose**: Reminds customers about expiring policies (within 30 days)
- **Business Logic**: 
  - Checks if end_date <= 30 days from today
  - Only for ACTIVE policies
  - Only if end_date actually changed

### 🌐 Frontend Usage
- **File**: Automatic (runs when policy dates are updated)
- **API**: Any policy update operation
- **When**: Policy end_date is updated

---

### ✅ TRIGGER 5: after_policy_insert_assign_agent

### 💻 SQL Code
```sql
DELIMITER $$

CREATE TRIGGER after_policy_insert_assign_agent
AFTER INSERT ON policy
FOR EACH ROW
BEGIN
    DECLARE next_agent_id VARCHAR(50);
    
    -- Find agent with fewest policies (round-robin load balancing)
    SELECT agent_id INTO next_agent_id
    FROM agent
    WHERE status = 'ACTIVE'
    ORDER BY (
        SELECT COUNT(*) 
        FROM policy_agent 
        WHERE policy_agent.agent_id = agent.agent_id
    ) ASC
    LIMIT 1;
    
    -- Assign agent to policy
    IF next_agent_id IS NOT NULL THEN
        INSERT INTO policy_agent (policy_id, agent_id, assigned_date)
        VALUES (NEW.policy_id, next_agent_id, CURDATE());
    END IF;
END$$

DELIMITER ;
```

### 📝 Explanation
- **Type**: AFTER INSERT trigger
- **Purpose**: Automatically assigns an agent to new policies (load balancing)
- **Business Logic**: 
  - Finds ACTIVE agent with fewest current assignments
  - Uses nested query to count policies per agent
  - Ensures fair distribution of workload

### 🌐 Frontend Usage
- **File**: Automatic (runs when policy is created)
- **API**: `POST /api/policies/purchase` (server.js line 884)
- **Feature**: IWAS-F040-auto-assign-agent (branch name)

---

## 4. STORED PROCEDURES & FUNCTIONS

### ℹ️ Status
**Not implemented in current project**

### 💡 Why?
- Node.js with MySQL2 handles business logic in application layer
- Triggers cover automated database operations
- Complex workflows handled by Express.js middleware

### 📝 Could Add For VIVA (Example)
```sql
DELIMITER $$

CREATE PROCEDURE calculate_claim_settlement(
    IN claim_id_param VARCHAR(50),
    OUT settlement_amount DECIMAL(12,2)
)
BEGIN
    DECLARE claim_amt DECIMAL(12,2);
    DECLARE policy_coverage DECIMAL(12,2);
    
    SELECT c.amount, p.coverage_details
    INTO claim_amt, policy_coverage
    FROM claim c
    JOIN policy p ON c.policy_id = p.policy_id
    WHERE c.claim_id = claim_id_param;
    
    SET settlement_amount = LEAST(claim_amt, policy_coverage);
END$$

DELIMITER ;
```

---

## 5. CRUD OPERATIONS

### 📁 File Location
`database_scripts/06_crud_operations.sql` (310 lines)

---

### ✅ CREATE Operations (5 Examples)

#### 1️⃣ Register New Customer
```sql
-- File: server.js line 389
INSERT INTO customer (customer_id, name, email, password) 
VALUES (?, ?, ?, ?);
```
**Frontend**: `RegistrationPage.js` → `POST /api/register`

---

#### 2️⃣ File New Claim
```sql
-- File: server.js line 646
INSERT INTO claim (
    claim_id, policy_id, customer_id, description, 
    claim_date, claim_status, amount, status_log, 
    workflow_id, current_step_order, risk_score
) VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?, ?);
```
**Frontend**: `FileClaim.js` → `POST /api/my-claims`

---

#### 3️⃣ Create Workflow
```sql
-- File: server.js line 569
INSERT INTO workflows (workflow_id, name, description) 
VALUES (?, ?, ?);
```
**Frontend**: `WorkflowEditor.js` → `POST /api/admin/workflows`

---

#### 4️⃣ Add Workflow Step
```sql
INSERT INTO workflow_steps (
    step_id, workflow_id, step_order, 
    step_name, action_type, step_config
) VALUES (?, ?, ?, ?, ?, ?);
```
**Frontend**: `WorkflowEditor.js` → `POST /api/admin/workflows/:id/steps`

---

#### 5️⃣ Purchase Policy
```sql
-- File: server.js line 907
INSERT INTO policy (
    policy_id, policy_date, start_date, end_date, 
    premium_amount, coverage_details, status, policy_type
) VALUES (?, ?, ?, ?, ?, ?, 'PENDING_APPROVAL', ?);

-- Link to customer
INSERT INTO customer_policy (customer_id, policy_id) 
VALUES (?, ?);
```
**Frontend**: `Dashboard.js` → `POST /api/policies/purchase`

---

### ✅ READ Operations (6 Examples)

#### 1️⃣ Get Customer's Policies
```sql
-- File: server.js line 689
SELECT 
    p.policy_id, p.policy_date, p.start_date, p.end_date,
    p.premium_amount, p.coverage_details, p.status, p.policy_type
FROM policy p
JOIN customer_policy cp ON p.policy_id = cp.policy_id
WHERE cp.customer_id = ?
ORDER BY p.policy_date DESC;
```
**Frontend**: `Dashboard.js` → `GET /api/my-policies`

---

#### 2️⃣ Get Customer's Claims
```sql
SELECT 
    c.claim_id, c.description, c.claim_date, 
    c.claim_status, c.amount, c.policy_id
FROM claim c
WHERE c.customer_id = ?
ORDER BY c.claim_date DESC;
```
**Frontend**: `Dashboard.js` → `GET /api/my-claims`

---

#### 3️⃣ Get Pending Claims (Admin)
```sql
-- File: server.js line 1021
SELECT 
    c.claim_id, c.policy_id, c.customer_id, c.description,
    c.claim_date, c.claim_status, c.amount, c.current_step_order,
    cust.name AS customer_name, cust.email AS customer_email,
    p.policy_type, p.coverage_details
FROM claim c
LEFT JOIN customer cust ON c.customer_id = cust.customer_id
LEFT JOIN policy p ON c.policy_id = p.policy_id
WHERE c.claim_status = 'PENDING'
ORDER BY c.claim_date ASC;
```
**Frontend**: `AdminDashboard.js` → `GET /api/admin/pending-claims`

---

#### 4️⃣ Get Pending Policies (Admin)
```sql
-- File: server.js line 1126
SELECT 
    p.policy_id, p.policy_date, p.start_date, p.end_date,
    p.premium_amount, p.coverage_details, p.status, p.policy_type,
    cp.customer_id,
    c.name AS customer_name, c.email AS customer_email
FROM policy p
JOIN customer_policy cp ON p.policy_id = cp.policy_id
JOIN customer c ON cp.customer_id = c.customer_id
WHERE p.status = 'PENDING_APPROVAL'
ORDER BY p.policy_date ASC;
```
**Frontend**: `AdminDashboard.js` → `GET /api/admin/pending-policies`

---

#### 5️⃣ Get Workflow Details
```sql
-- File: server.js line 1262
SELECT * FROM workflows WHERE workflow_id = ?;

SELECT * FROM workflow_steps 
WHERE workflow_id = ? 
ORDER BY step_order;
```
**Frontend**: `WorkflowEditor.js` → `GET /api/admin/workflows/:id`

---

#### 6️⃣ Get High-Risk Alerts
```sql
SELECT 
    c.claim_id, c.policy_id, c.description, c.amount,
    c.claim_date, c.risk_score, c.claim_status,
    cust.name AS customer_name,
    p.policy_type
FROM claim c
JOIN customer cust ON c.customer_id = cust.customer_id
JOIN policy p ON c.policy_id = p.policy_id
WHERE c.risk_score > 70
ORDER BY c.risk_score DESC;
```
**Frontend**: `HighRiskAlerts.js` → `GET /api/admin/high-risk-claims`

---

### ✅ UPDATE Operations (10 Examples)

#### 1️⃣ Approve Claim
```sql
-- File: server.js line 1088
UPDATE claim 
SET claim_status = 'APPROVED', 
    status_log = CONCAT(IFNULL(status_log, ''), ?),
    current_step_order = ?
WHERE claim_id = ?;
```
**Frontend**: `AdminDashboard.js` → `PUT /api/admin/claims/:id/status`

---

#### 2️⃣ Decline Claim
```sql
UPDATE claim 
SET claim_status = 'DECLINED', 
    status_log = CONCAT(IFNULL(status_log, ''), '\n[DECLINED] Reason: ?')
WHERE claim_id = ?;
```
**Frontend**: `AdminDashboard.js` → `PUT /api/admin/claims/:id/status`

---

#### 3️⃣ Approve Policy
```sql
-- File: server.js line 1182
UPDATE policy SET 
    status = 'AWAITING_PAYMENT',
    initial_approver_id = ?,
    initial_approval_date = CURRENT_TIMESTAMP
WHERE policy_id = ?;
```
**Frontend**: `AdminDashboard.js` → `PUT /api/admin/policies/:id/status`

---

#### 4️⃣ Decline Policy
```sql
-- File: server.js line 1209
UPDATE policy SET 
    status = 'DECLINED',
    initial_approver_id = ?,
    initial_approval_date = CURRENT_TIMESTAMP
WHERE policy_id = ?;
```
**Frontend**: `AdminDashboard.js` → `PUT /api/admin/policies/:id/status`

---

#### 5️⃣ Activate Policy (Payment Success)
```sql
-- File: server.js line 992
UPDATE policy SET status = 'ACTIVE'
WHERE policy_id = ? AND status = 'AWAITING_PAYMENT';
```
**Frontend**: `Dashboard.js` → Triggered by `after_payment_success` trigger

---

#### 6️⃣ Update Customer Profile
```sql
UPDATE customer 
SET name = ?, phone = ?, address = ?
WHERE customer_id = ?;
```
**Frontend**: `ProfilePage.js` → `PUT /api/profile`

---

#### 7️⃣ Update Claim Workflow Step
```sql
-- File: server.js line 217
UPDATE claim 
SET current_step_order = ? 
WHERE claim_id = ? 
AND current_step_order = ?;
```
**Frontend**: `WorkflowEditor.js` → Automatic workflow progression

---

#### 8️⃣ Assign Admin to Claim
```sql
-- File: server.js line 168
UPDATE claim 
SET admin_id = ? 
WHERE claim_id = ?;
```
**Frontend**: Automatic via workflow step configuration

---

#### 9️⃣ Mark Notification as Read
```sql
UPDATE reminder_notification 
SET is_read = TRUE 
WHERE notification_id = ?;
```
**Frontend**: `NotificationPanel.js` → `PUT /api/notifications/:id/read`

---

#### 🔟 Update Workflow Configuration
```sql
UPDATE workflow_steps 
SET step_name = ?, action_type = ?, step_config = ?
WHERE step_id = ?;
```
**Frontend**: `WorkflowEditor.js` → `PUT /api/admin/workflows/steps/:id`

---

### ✅ DELETE Operations (5 Examples)

#### 1️⃣ Delete Workflow Step
```sql
DELETE FROM workflow_steps 
WHERE step_id = ?;
```
**Frontend**: `WorkflowEditor.js` → `DELETE /api/admin/workflows/steps/:id`

---

#### 2️⃣ Delete Workflow
```sql
DELETE FROM workflows 
WHERE workflow_id = ?;
```
**Frontend**: `WorkflowList.js` → `DELETE /api/admin/workflows/:id`

---

#### 3️⃣ Delete Agent Assignment
```sql
DELETE FROM policy_agent 
WHERE policy_id = ? AND agent_id = ?;
```
**Frontend**: `AdminDashboard.js` → `DELETE /api/admin/agents/assignments`

---

#### 4️⃣ Delete Old Notifications
```sql
DELETE FROM reminder_notification 
WHERE created_at < DATE_SUB(CURDATE(), INTERVAL 90 DAY)
AND is_read = TRUE;
```
**Frontend**: Automatic cleanup job (could be cron job)

---

#### 5️⃣ Cancel Claim
```sql
DELETE FROM claim 
WHERE claim_id = ? 
AND claim_status = 'PENDING' 
AND customer_id = ?;
```
**Frontend**: `Dashboard.js` → `DELETE /api/my-claims/:id`

---

## 6. NESTED QUERIES

### 📁 File Location
`database_scripts/05_complex_queries.sql`

---

### ✅ NESTED QUERY 1: High-Risk Claims with Subquery

### 💻 SQL Code
```sql
-- Get high-risk claims with customer details
SELECT 
    c.claim_id,
    c.description,
    c.amount,
    c.risk_score,
    cust.name AS customer_name,
    cust.email
FROM claim c
JOIN customer cust ON c.customer_id = cust.customer_id
WHERE c.claim_id IN (
    -- Nested subquery: Find claims with risk score above average
    SELECT claim_id 
    FROM claim 
    WHERE risk_score > (
        SELECT AVG(risk_score) FROM claim
    )
)
ORDER BY c.risk_score DESC;
```

### 📝 Explanation
- **Outer Query**: Gets claim details with customer info
- **First Nested Query**: Finds claims with above-average risk
- **Second Nested Query**: Calculates average risk score
- **Uses**: IN clause with subquery

### 🌐 Frontend Usage
- **File**: `HighRiskAlerts.js`
- **API**: `GET /api/admin/high-risk-claims`
- **Purpose**: Show high-risk claims to fraud detection team

---

### ✅ NESTED QUERY 2: Policies Expiring Soon

### 💻 SQL Code
```sql
SELECT 
    p.policy_id,
    p.end_date,
    cp.customer_id,
    c.name AS customer_name
FROM policy p
JOIN customer_policy cp ON p.policy_id = cp.policy_id
JOIN customer c ON cp.customer_id = c.customer_id
WHERE p.policy_id IN (
    -- Nested: Find policies expiring in next 30 days
    SELECT policy_id 
    FROM policy 
    WHERE end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
    AND status = 'ACTIVE'
)
ORDER BY p.end_date ASC;
```

### 📝 Explanation
- **Outer Query**: Gets full policy and customer details
- **Nested Query**: Identifies policies expiring within 30 days
- **Uses**: DATE functions with subquery

### 🌐 Frontend Usage
- **File**: `Dashboard.js` (renewal reminder banner)
- **API**: `GET /api/my-policies/expiring`
- **Purpose**: Show renewal reminders to customers

---

### ✅ NESTED QUERY 3: Top Spending Customers

### 💻 SQL Code
```sql
SELECT 
    c.customer_id,
    c.name,
    c.email,
    total_claims.total_amount
FROM customer c
JOIN (
    -- Nested: Calculate total claim amount per customer
    SELECT 
        customer_id,
        SUM(amount) AS total_amount
    FROM claim
    WHERE claim_status = 'APPROVED'
    GROUP BY customer_id
) AS total_claims ON c.customer_id = total_claims.customer_id
WHERE total_claims.total_amount > 50000
ORDER BY total_claims.total_amount DESC;
```

### 📝 Explanation
- **Outer Query**: Gets customer details
- **Nested Query**: Subquery in FROM clause (derived table)
- **Aggregation**: SUM with GROUP BY in nested query
- **Filter**: Customers with claims > 50,000

### 🌐 Frontend Usage
- **File**: `AdminDashboard.js` (analytics section)
- **API**: `GET /api/admin/top-customers`
- **Purpose**: Identify high-value customers

---

## 7. JOIN QUERIES

### 📁 File Location
`database_scripts/05_complex_queries.sql`

---

### ✅ JOIN QUERY 1: Customer Policies with Full Details (3-Table JOIN)

### 💻 SQL Code
```sql
-- File: server.js line 689
SELECT 
    c.customer_id,
    c.name AS customer_name,
    c.email,
    p.policy_id,
    p.policy_type,
    p.premium_amount,
    p.start_date,
    p.end_date,
    p.status,
    p.coverage_details
FROM customer c
INNER JOIN customer_policy cp ON c.customer_id = cp.customer_id
INNER JOIN policy p ON cp.policy_id = p.policy_id
WHERE c.customer_id = ?
ORDER BY p.policy_date DESC;
```

### 📝 Explanation
- **3-Table JOIN**: customer → customer_policy → policy
- **Junction Table**: customer_policy (many-to-many relationship)
- **Type**: INNER JOIN (only returns matching records)

### 🌐 Frontend Usage
- **File**: `Dashboard.js`
- **API**: `GET /api/my-policies`
- **Purpose**: Show all policies owned by logged-in customer

---

### ✅ JOIN QUERY 2: Claims with Full Context (4-Table JOIN)

### 💻 SQL Code
```sql
-- File: server.js line 1021
SELECT 
    c.claim_id,
    c.description,
    c.claim_date,
    c.claim_status,
    c.amount,
    c.current_step_order,
    cust.name AS customer_name,
    cust.email AS customer_email,
    p.policy_id,
    p.policy_type,
    p.coverage_details,
    a.name AS assigned_admin_name,
    a.role AS admin_role
FROM claim c
LEFT JOIN customer cust ON c.customer_id = cust.customer_id
LEFT JOIN policy p ON c.policy_id = p.policy_id
LEFT JOIN administrator a ON c.admin_id = a.admin_id
WHERE c.claim_status = 'PENDING'
ORDER BY c.claim_date ASC;
```

### 📝 Explanation
- **4-Table JOIN**: claim → customer, policy, administrator
- **Type**: LEFT JOIN (includes claims even without admin assigned)
- **Use Case**: Admin dashboard showing all pending claims

### 🌐 Frontend Usage
- **File**: `AdminDashboard.js`
- **API**: `GET /api/admin/pending-claims`
- **Purpose**: Show pending claims with all related information

---

### ✅ JOIN QUERY 3: Agent Workload Report (2-Table JOIN with Aggregate)

### 💻 SQL Code
```sql
SELECT 
    a.agent_id,
    a.name AS agent_name,
    a.email,
    a.status,
    COUNT(pa.policy_id) AS assigned_policies
FROM agent a
LEFT JOIN policy_agent pa ON a.agent_id = pa.agent_id
GROUP BY a.agent_id, a.name, a.email, a.status
HAVING COUNT(pa.policy_id) > 0
ORDER BY assigned_policies DESC;
```

### 📝 Explanation
- **2-Table JOIN**: agent → policy_agent
- **Type**: LEFT JOIN with GROUP BY
- **Aggregate**: COUNT to get policies per agent
- **HAVING**: Filter agents with at least 1 policy

### 🌐 Frontend Usage
- **File**: `AdminDashboard.js` (agent management section)
- **API**: `GET /api/admin/agents/workload`
- **Purpose**: Monitor agent workload distribution

---

### ✅ JOIN QUERY 4: Workflow Execution Tracking

### 💻 SQL Code
```sql
SELECT 
    c.claim_id,
    c.claim_status,
    c.current_step_order,
    w.workflow_id,
    w.name AS workflow_name,
    ws.step_name AS current_step_name,
    ws.action_type
FROM claim c
LEFT JOIN workflows w ON c.workflow_id = w.workflow_id
LEFT JOIN workflow_steps ws ON (
    w.workflow_id = ws.workflow_id 
    AND c.current_step_order = ws.step_order
)
WHERE c.workflow_id IS NOT NULL
ORDER BY c.claim_date DESC;
```

### 📝 Explanation
- **3-Table JOIN**: claim → workflows → workflow_steps
- **Complex JOIN**: Matches both workflow_id AND step_order
- **Purpose**: Track which step each claim is currently on

### 🌐 Frontend Usage
- **File**: `WorkflowMetricsDashboard.js`
- **API**: `GET /api/admin/workflow-executions`
- **Purpose**: Monitor workflow progress for all claims

---

## 8. AGGREGATE QUERIES

### 📁 File Location
`database_scripts/05_complex_queries.sql`

---

### ✅ AGGREGATE QUERY 1: Claims Statistics by Status

### 💻 SQL Code
```sql
SELECT 
    claim_status,
    COUNT(*) AS total_claims,
    SUM(amount) AS total_amount,
    AVG(amount) AS average_amount,
    MIN(amount) AS min_amount,
    MAX(amount) AS max_amount
FROM claim
GROUP BY claim_status
HAVING COUNT(*) > 5
ORDER BY total_amount DESC;
```

### 📝 Explanation
- **Aggregates Used**: COUNT, SUM, AVG, MIN, MAX
- **GROUP BY**: Groups by claim_status
- **HAVING**: Only shows statuses with > 5 claims
- **All 5 aggregate functions in one query!**

### 🌐 Frontend Usage
- **File**: `AdminDashboard.js`
- **API**: `GET /api/admin/claims/statistics`
- **Purpose**: Dashboard overview with statistics cards

---

### ✅ AGGREGATE QUERY 2: Monthly Revenue Report

### 💻 SQL Code
```sql
SELECT 
    YEAR(policy_date) AS year,
    MONTH(policy_date) AS month,
    COUNT(policy_id) AS policies_sold,
    SUM(premium_amount) AS total_revenue,
    AVG(premium_amount) AS avg_premium
FROM policy
WHERE policy_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
GROUP BY YEAR(policy_date), MONTH(policy_date)
ORDER BY year DESC, month DESC;
```

### 📝 Explanation
- **Aggregates**: COUNT, SUM, AVG
- **Date Functions**: YEAR(), MONTH(), DATE_SUB()
- **GROUP BY**: Multiple columns (year, month)
- **Time Range**: Last 12 months

### 🌐 Frontend Usage
- **File**: `AdminDashboard.js` (revenue chart)
- **API**: `GET /api/admin/revenue/monthly`
- **Purpose**: Monthly revenue trend visualization

---

### ✅ AGGREGATE QUERY 3: Customer Claim History Summary

### 💻 SQL Code
```sql
SELECT 
    c.customer_id,
    c.name,
    c.email,
    COUNT(cl.claim_id) AS total_claims,
    SUM(CASE WHEN cl.claim_status = 'APPROVED' THEN 1 ELSE 0 END) AS approved_claims,
    SUM(CASE WHEN cl.claim_status = 'DECLINED' THEN 1 ELSE 0 END) AS declined_claims,
    AVG(cl.amount) AS avg_claim_amount,
    MAX(cl.claim_date) AS last_claim_date
FROM customer c
LEFT JOIN claim cl ON c.customer_id = cl.customer_id
GROUP BY c.customer_id, c.name, c.email
HAVING total_claims > 0
ORDER BY total_claims DESC;
```

### 📝 Explanation
- **Aggregates**: COUNT, SUM with CASE, AVG, MAX
- **Conditional Aggregation**: CASE WHEN for approved/declined counts
- **LEFT JOIN**: Includes customers even without claims
- **HAVING**: Only customers with at least 1 claim

### 🌐 Frontend Usage
- **File**: `AdminDashboard.js` (customer analytics)
- **API**: `GET /api/admin/customers/summary`
- **Purpose**: Analyze customer claim patterns

---

### ✅ AGGREGATE QUERY 4: Risk Score Distribution

### 💻 SQL Code
```sql
SELECT 
    CASE 
        WHEN risk_score >= 80 THEN 'CRITICAL'
        WHEN risk_score >= 60 THEN 'HIGH'
        WHEN risk_score >= 40 THEN 'MEDIUM'
        ELSE 'LOW'
    END AS risk_category,
    COUNT(*) AS claim_count,
    AVG(amount) AS avg_claim_amount,
    SUM(amount) AS total_amount
FROM claim
GROUP BY risk_category
ORDER BY 
    CASE risk_category
        WHEN 'CRITICAL' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        WHEN 'LOW' THEN 4
    END;
```

### 📝 Explanation
- **Aggregates**: COUNT, AVG, SUM
- **CASE Expression**: Creates risk categories
- **GROUP BY**: Groups by calculated category
- **Custom ORDER BY**: Sort by risk level

### 🌐 Frontend Usage
- **File**: `HighRiskAlerts.js`
- **API**: `GET /api/admin/claims/risk-distribution`
- **Purpose**: Risk analysis dashboard

---

## 9. FRONTEND-BACKEND MAPPING

### 📊 Complete Flow Diagram

```
FRONTEND COMPONENT → FETCH API CALL → EXPRESS ROUTE → SQL QUERY → DATABASE
```

---

### ✅ Registration Flow

```
RegistrationPage.js (line 45)
    ↓ fetch('POST /api/register')
    ↓
server.js (line 367)
    ↓ app.post('/api/register')
    ↓
server.js (line 389)
    ↓ INSERT INTO customer (customer_id, name, email, password) VALUES (?, ?, ?, ?)
    ↓
dbms_database.customer table
```

---

### ✅ Login Flow

```
LoginPage.js (line 78)
    ↓ fetch('POST /api/login')
    ↓
server.js (line 407)
    ↓ app.post('/api/login')
    ↓
server.js (line 416)
    ↓ SELECT * FROM customer WHERE email = ?
    ↓
dbms_database.customer table
```

---

### ✅ File Claim Flow

```
FileClaim.js (line 120)
    ↓ fetch('POST /api/my-claims')
    ↓
server.js (line 532)
    ↓ app.post('/api/my-claims')
    ↓
server.js (line 646)
    ↓ INSERT INTO claim (claim_id, policy_id, customer_id, ...)
    ↓
dbms_database.claim table
    ↓ [TRIGGER: after_claim_status_update fires]
    ↓
reminder_notification table (auto-created by trigger)
```

---

### ✅ Approve Claim Flow

```
AdminDashboard.js (line 245)
    ↓ fetch('PUT /api/admin/claims/:claimId/status')
    ↓
server.js (line 1045)
    ↓ app.put('/api/admin/claims/:claimId/status')
    ↓
server.js (line 1088)
    ↓ UPDATE claim SET claim_status = 'APPROVED', status_log = ...
    ↓
dbms_database.claim table
    ↓ [TRIGGER: after_claim_status_update fires]
    ↓
reminder_notification table (customer gets notified)
```

---

### ✅ Purchase Policy Flow

```
Dashboard.js (line 380)
    ↓ fetch('POST /api/policies/purchase')
    ↓
server.js (line 884)
    ↓ app.post('/api/policies/purchase')
    ↓
server.js (line 907)
    ↓ INSERT INTO policy (policy_id, policy_date, ...) VALUES (...)
    ↓
dbms_database.policy table
    ↓ [TRIGGER 1: after_policy_insert fires]
    ↓
reminder_notification table (welcome notification)
    ↓ [TRIGGER 2: after_policy_insert_assign_agent fires]
    ↓
policy_agent table (agent auto-assigned)
```

---

### ✅ Payment Success Flow

```
Dashboard.js (line 450)
    ↓ fetch('POST /api/policies/:policyId/mock-activate')
    ↓
server.js (line 936)
    ↓ app.post('/api/policies/:policyId/mock-activate')
    ↓
server.js (line 979)
    ↓ INSERT INTO initial_payment (payment_id, policy_id, amount, ...)
    ↓
dbms_database.initial_payment table
    ↓ [TRIGGER: after_payment_success fires]
    ↓
server.js (line 992)
    ↓ UPDATE policy SET status = 'ACTIVE'
    ↓
dbms_database.policy table (status changed to ACTIVE)
```

---

### ✅ Workflow Management Flow

```
WorkflowEditor.js (line 180)
    ↓ fetch('GET /api/admin/workflows/:workflowId')
    ↓
server.js (line 1257)
    ↓ app.get('/api/admin/workflows/:workflowId')
    ↓
server.js (line 1262)
    ↓ SELECT * FROM workflows WHERE workflow_id = ?
    ↓
server.js (line 1268)
    ↓ SELECT * FROM workflow_steps WHERE workflow_id = ? ORDER BY step_order
    ↓
dbms_database.workflows + workflow_steps tables
```

---

## 🎯 VIVA QUICK REFERENCE

### Key Points to Remember:

1. **Database Creation**: UTF-8 support with utf8mb4
2. **User Creation**: INSERT INTO administrator with bcrypt hashing
3. **5 Triggers**: 
   - after_claim_status_update (notification)
   - after_payment_success (activate policy)
   - after_policy_insert (welcome)
   - policy_renewal_reminder (30-day alert)
   - after_policy_insert_assign_agent (load balancing)
4. **CRUD**: 5 CREATE, 6 READ, 10 UPDATE, 5 DELETE
5. **Nested Queries**: High-risk claims, expiring policies, top customers
6. **JOINs**: 2-4 table joins with LEFT/INNER JOIN
7. **Aggregates**: COUNT, SUM, AVG, MIN, MAX with GROUP BY/HAVING

### File Locations:
- Database: `database_scripts/01_create_database.sql`
- Users: `database_scripts/add_admin_user.sql`
- Triggers: `database_scripts/03_create_triggers.sql`
- Complex Queries: `database_scripts/05_complex_queries.sql`
- CRUD: `database_scripts/06_crud_operations.sql`
- Backend: `server.js`
- Frontend: `insurance-frontend/src/components/`

---

## 📌 DEMO FLOW FOR VIVA

1. **Show Database Creation** → Open 01_create_database.sql
2. **Show User Creation** → Open add_admin_user.sql
3. **Explain Trigger 5** (auto-assign-agent) → 03_create_triggers.sql line 161
4. **Demo CRUD** → Show FileClaim.js → server.js line 646 → database
5. **Show Nested Query** → 05_complex_queries.sql (high-risk claims)
6. **Show JOIN Query** → server.js line 1021 (4-table join)
7. **Show Aggregate Query** → 05_complex_queries.sql (claims statistics)
8. **Explain Complete Flow** → Registration → Login → Purchase → Claim → Approve

---

## ✅ ALL SQL CONCEPTS COVERED ✓

- [x] Database Creation
- [x] User Creation (INSERT with password hashing)
- [x] Triggers (5 triggers with AFTER/BEFORE)
- [ ] Stored Procedures (not implemented - explain why)
- [ ] Functions (not implemented - explain why)
- [x] CRUD Operations (26 examples)
- [x] Nested Queries (subqueries with IN, derived tables)
- [x] JOIN Queries (2-4 table joins, LEFT/INNER)
- [x] Aggregate Queries (COUNT, SUM, AVG, MIN, MAX, GROUP BY, HAVING)
- [x] Frontend-Backend mapping (complete flow diagrams)

---

**Good luck with your VIVA! 🎓✨**
