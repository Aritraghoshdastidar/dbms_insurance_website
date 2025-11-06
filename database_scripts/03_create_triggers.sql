-- ================================================================
-- 03 - CREATE TRIGGERS
-- ================================================================
-- Purpose: Create automated triggers for business logic
-- Dependencies: 02_create_tables.sql must be run first
-- ================================================================

USE `dbms_database`;

-- ================================================================
-- TRIGGER 1: after_claim_status_update
-- Purpose: Automatically notify customer when claim status changes
-- Type: AFTER UPDATE on claim table
-- ================================================================
DROP TRIGGER IF EXISTS `after_claim_status_update`;

DELIMITER $$

CREATE TRIGGER `after_claim_status_update` 
AFTER UPDATE ON `claim` 
FOR EACH ROW 
BEGIN
    DECLARE v_notification_id VARCHAR(50);
    
    -- Only create notification if status actually changed
    IF OLD.claim_status != NEW.claim_status THEN
        -- Generate unique notification ID
        SET v_notification_id = CONCAT('NOTIF_CLM_', NEW.claim_id, '_STATUS');
        
        -- Insert or update reminder (idempotent)
        INSERT INTO reminder (
            notification_id, 
            notification_date, 
            status, 
            message, 
            type, 
            customer_id
        )
        VALUES (
            v_notification_id, 
            NOW(), 
            'PENDING',
            CONCAT('Your claim ', NEW.claim_id, ' status has been updated to: ', NEW.claim_status),
            'CLAIM_UPDATE', 
            NEW.customer_id
        )
        ON DUPLICATE KEY UPDATE
            notification_date = NOW(),
            message = CONCAT('Your claim ', NEW.claim_id, ' status has been updated to: ', NEW.claim_status),
            status = 'PENDING';
    END IF;
END$$

DELIMITER ;

-- ================================================================
-- TRIGGER 2: after_payment_success
-- Purpose: Activate policy and notify customer after payment
-- Type: AFTER INSERT on payment table
-- ================================================================
DROP TRIGGER IF EXISTS `after_payment_success`;

DELIMITER $$

CREATE TRIGGER `after_payment_success` 
AFTER INSERT ON `payment` 
FOR EACH ROW 
BEGIN
    DECLARE v_policy_id VARCHAR(50);
    DECLARE v_customer_id VARCHAR(50);
    DECLARE v_notification_id VARCHAR(50);
    
    -- Only process if payment is successful
    IF NEW.status = 'SUCCESS' THEN
        -- Get policy_id and customer_id from customer_policy
        SELECT cp.policy_id, cp.customer_id
        INTO v_policy_id, v_customer_id
        FROM customer_policy cp
        WHERE cp.customer_policy_id = NEW.customer_policy_id;
        
        -- Update policy status to ACTIVE
        UPDATE policy
        SET status = 'ACTIVE'
        WHERE policy_id = v_policy_id;
        
        -- Create payment confirmation notification
        SET v_notification_id = CONCAT('NOTIF_PAY_', NEW.payment_id);
        
        INSERT INTO reminder (
            notification_id, 
            notification_date, 
            status, 
            message, 
            type, 
            customer_id
        )
        VALUES (
            v_notification_id,
            NOW(),
            'PENDING',
            CONCAT('Payment successful! Your policy ', v_policy_id, ' is now ACTIVE.'),
            'PAYMENT_SUCCESS',
            v_customer_id
        );
    END IF;
END$$

DELIMITER ;

-- ================================================================
-- TRIGGER 3: after_policy_insert
-- Purpose: Welcome notification when new policy created
-- Type: AFTER INSERT on policy table
-- ================================================================
DROP TRIGGER IF EXISTS `after_policy_insert`;

DELIMITER $$

CREATE TRIGGER `after_policy_insert` 
AFTER INSERT ON `policy` 
FOR EACH ROW 
BEGIN
    DECLARE v_customer_id VARCHAR(50);
    DECLARE v_notification_id VARCHAR(50);
    
    -- Get customer_id from most recent customer_policy record for this policy
    SELECT customer_id INTO v_customer_id
    FROM customer_policy
    WHERE policy_id = NEW.policy_id
    LIMIT 1;
    
    -- Create welcome notification if customer found
    IF v_customer_id IS NOT NULL THEN
        SET v_notification_id = CONCAT('NOTIF_POL_', NEW.policy_id, '_WELCOME');
        
        INSERT IGNORE INTO reminder (
            notification_id,
            notification_date,
            status,
            message,
            type,
            customer_id
        )
        VALUES (
            v_notification_id,
            NOW(),
            'PENDING',
            CONCAT('Welcome! Your new ', NEW.policy_type, ' policy ', NEW.policy_id, ' has been created. Awaiting approval.'),
            'POLICY_CREATED',
            v_customer_id
        );
    END IF;
END$$

DELIMITER ;

-- ================================================================
-- TRIGGER 4: policy_renewal_reminder
-- Purpose: Create reminder for policies expiring within 30 days
-- Type: BEFORE UPDATE on policy table
-- ================================================================
DROP TRIGGER IF EXISTS `policy_renewal_reminder`;

DELIMITER $$

CREATE TRIGGER `policy_renewal_reminder` 
BEFORE UPDATE ON `policy` 
FOR EACH ROW 
BEGIN
    DECLARE v_customer_id VARCHAR(50);
    DECLARE v_notification_id VARCHAR(50);
    
    -- Check if policy is active and expiring within 30 days
    IF NEW.status = 'ACTIVE' AND DATEDIFF(NEW.end_date, NOW()) <= 30 AND DATEDIFF(NEW.end_date, NOW()) > 0 THEN
        -- Get customer_id
        SELECT customer_id INTO v_customer_id
        FROM customer_policy
        WHERE policy_id = NEW.policy_id
        LIMIT 1;
        
        IF v_customer_id IS NOT NULL THEN
            SET v_notification_id = CONCAT('NOTIF_POL_', NEW.policy_id, '_RENEWAL');
            
            INSERT IGNORE INTO reminder (
                notification_id,
                notification_date,
                status,
                message,
                type,
                customer_id
            )
            VALUES (
                v_notification_id,
                NOW(),
                'PENDING',
                CONCAT('Your policy ', NEW.policy_id, ' expires on ', NEW.end_date, '. Please renew soon!'),
                'POLICY_RENEWAL',
                v_customer_id
            );
        END IF;
    END IF;
END$$

DELIMITER ;

-- ================================================================
-- TRIGGER 5: after_policy_insert_assign_agent
-- Purpose: Auto-assign agent to new policy (round-robin)
-- Type: AFTER INSERT on policy table
-- ================================================================
DROP TRIGGER IF EXISTS `after_policy_insert_assign_agent`;

DELIMITER $$

CREATE TRIGGER `after_policy_insert_assign_agent` 
AFTER INSERT ON `policy` 
FOR EACH ROW 
BEGIN
    DECLARE v_agent_id VARCHAR(50);
    
    -- Get least assigned agent (simple round-robin)
    SELECT agent_id INTO v_agent_id
    FROM agent
    WHERE agent_id NOT IN (
        SELECT agent_id 
        FROM agent_policy 
        WHERE policy_id = NEW.policy_id
    )
    ORDER BY (
        SELECT COUNT(*) 
        FROM agent_policy ap 
        WHERE ap.agent_id = agent.agent_id
    ) ASC
    LIMIT 1;
    
    -- Assign agent if found
    IF v_agent_id IS NOT NULL THEN
        INSERT IGNORE INTO agent_policy (agent_id, policy_id)
        VALUES (v_agent_id, NEW.policy_id);
    END IF;
END$$

DELIMITER ;

-- Display confirmation
SELECT 'All 5 triggers created successfully!' AS Status;
SELECT 'Triggers: after_claim_status_update, after_payment_success, after_policy_insert, policy_renewal_reminder, after_policy_insert_assign_agent' AS Created_Triggers;
