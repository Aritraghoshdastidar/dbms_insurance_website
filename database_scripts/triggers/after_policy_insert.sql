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