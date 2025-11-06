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