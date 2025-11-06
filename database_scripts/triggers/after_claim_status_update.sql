
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