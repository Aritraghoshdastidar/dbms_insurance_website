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