-- =============================================================
-- 10 - FIX RENEWAL REMINDER CUSTOMER LINK
-- =============================================================
-- Purpose:
--  1) Backfill customer_id for existing RENEWAL_REMINDER rows
--     where customer_id is NULL by inferring policy_id from
--     notification_id pattern: NOTIF_POL_{policy_id}_RENEWAL
--  2) Update the supporting trigger to also attach the renewal
--     reminder to the customer when the customer_policy link is
--     created (covers future cases).
-- =============================================================

USE `dbms_database`;

-- 1) Backfill existing renewal reminders with NULL customer_id
UPDATE reminder r
JOIN (
  SELECT 
    r.notification_id,
    SUBSTRING_INDEX(
      SUBSTRING_INDEX(r.notification_id, '_RENEWAL', 1),
      'NOTIF_POL_',
      -1
    ) AS policy_id
  FROM reminder r
  WHERE r.type = 'RENEWAL_REMINDER'
    AND r.customer_id IS NULL
) x ON x.notification_id = r.notification_id
JOIN customer_policy cp ON cp.policy_id = x.policy_id
SET r.customer_id = cp.customer_id;

-- 2) Recreate trigger to also fix renewal reminder on link
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

    -- Ensure welcome notification exists
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

    -- Also attach any previously-scheduled renewal reminder to this customer
    UPDATE reminder
    SET customer_id = NEW.customer_id
    WHERE notification_id = CONCAT('NOTIF_POL_', NEW.policy_id, '_RENEWAL')
      AND customer_id IS NULL;
END $$
DELIMITER ;

SELECT 'Renewal reminder customer link fix applied.' AS Status;
