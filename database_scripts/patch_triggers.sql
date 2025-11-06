-- Patch: Make claim status update reminder idempotent to avoid duplicate key errors
USE dbms_database;

DELIMITER $$
DROP TRIGGER IF EXISTS after_claim_status_update $$
CREATE TRIGGER after_claim_status_update
AFTER UPDATE ON claim FOR EACH ROW
BEGIN
    DECLARE v_notification_id VARCHAR(50);

    IF OLD.claim_status <> NEW.claim_status THEN
        SET v_notification_id = CONCAT('NOTIF_', NEW.claim_id, '_STATUS');

        -- Insert a single reminder per-claim for status changes; update it if it already exists
        INSERT INTO reminder (notification_id, notification_date, status, message, type, customer_id)
        VALUES (
            v_notification_id,
            NOW(),
            'PENDING',
            CONCAT('Your claim ', NEW.claim_id, ' status has been updated to: ', NEW.claim_status),
            'CLAIM_UPDATE',
            NEW.customer_id
        )
        ON DUPLICATE KEY UPDATE
            notification_date = VALUES(notification_date),
            status = VALUES(status),
            message = VALUES(message),
            type = VALUES(type),
            customer_id = VALUES(customer_id);
    END IF;
END $$
DELIMITER ;
