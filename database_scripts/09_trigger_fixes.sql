-- =============================================================
-- 09 - TRIGGER FIXES (welcome notification reliability)
-- =============================================================
-- Purpose:
--  Ensure a welcome/created notification is generated when a
--  policy is linked to a customer (some app flows insert
--  policy before the link; the original trigger on policy
--  insert can miss the customer_id lookup).
--
-- Usage:
--   mysql -u <user> -p dbms_database < database_scripts/09_trigger_fixes.sql
-- =============================================================

USE `dbms_database`;

DELIMITER $$

DROP TRIGGER IF EXISTS `after_customer_policy_insert_notify` $$

CREATE TRIGGER `after_customer_policy_insert_notify`
AFTER INSERT ON `customer_policy`
FOR EACH ROW
BEGIN
    DECLARE v_policy_type VARCHAR(50);
    DECLARE v_exists INT DEFAULT 0;

    -- Fetch policy type for message context (optional)
    SELECT policy_type INTO v_policy_type
    FROM policy
    WHERE policy_id = NEW.policy_id
    LIMIT 1;

    -- Use deterministic id to avoid duplicates
    SELECT COUNT(*) INTO v_exists
    FROM reminder
    WHERE notification_id = CONCAT('NOTIF_POL_', NEW.policy_id, '_WELCOME');

    IF v_exists = 0 THEN
        INSERT INTO reminder (
            notification_id,
            notification_date,
            status,
            message,
            type,
            customer_id
        ) VALUES (
            CONCAT('NOTIF_POL_', NEW.policy_id, '_WELCOME'),
            NOW(),
            'PENDING',
            CONCAT('Welcome! Your new ', COALESCE(v_policy_type, ''), ' policy ', NEW.policy_id, ' has been created. Awaiting approval.'),
            'POLICY_CREATED',
            NEW.customer_id
        );
    END IF;
END $$

DELIMITER ;

-- Display confirmation
SELECT 'Trigger after_customer_policy_insert_notify created/updated successfully.' AS Status;
