-- Select the database
USE insurance_db_dev;

-- Define the trigger
DELIMITER //

CREATE TRIGGER after_policy_insert_assign_agent
AFTER INSERT ON policy
FOR EACH ROW
BEGIN
    -- Declare a variable for the agent_policy primary key
    DECLARE new_agent_policy_id VARCHAR(50);

    -- Generate a unique ID for the agent_policy link
    SET new_agent_policy_id = CONCAT('AP_', NEW.policy_id);

    -- Insert the link into the agent_policy table, assigning to agent AGT001
    INSERT INTO agent_policy (id, policy_id, agent_id) 
    VALUES (new_agent_policy_id, NEW.policy_id, 'AGT001');

END //

DELIMITER ;