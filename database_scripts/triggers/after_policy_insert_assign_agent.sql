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