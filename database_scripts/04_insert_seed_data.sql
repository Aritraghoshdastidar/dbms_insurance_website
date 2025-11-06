-- ================================================================
-- 04 - INSERT SEED DATA
-- ================================================================
-- Purpose: Populate tables with initial test data
-- Dependencies: 02_create_tables.sql must be run first
-- ================================================================

USE `dbms_database`;

-- ================================================================
-- SEED DATA: administrator
-- ================================================================
INSERT INTO `administrator` VALUES 
('ADM001', 'System Admin', 'admin@insurance.com', '9999999999', 'System Admin', NULL),
('ADM002', 'Junior Adjuster', 'j.adjuster@insurance.com', NULL, 'Junior Adjuster', '$2b$10$oQmz7WTDSBeKHXiFZh3cg.lzgd0CyV3LtC8Ftsa9V4ILTYlO.MQk.');

-- ================================================================
-- SEED DATA: agent
-- ================================================================
INSERT INTO `agent` VALUES 
('AGT001', 'Agent Smith', 'agent.smith@insurance.com', '9988776655', 'North'),
('AGT002', 'Agent Jones', 'agent.jones@insurance.com', '9988776656', 'South'),
('AGT003', 'Agent Brown', 'agent.brown@insurance.com', '9988776657', 'East'),
('AGT004', 'Agent White', 'agent.white@insurance.com', '9988776658', 'West'),
('AGT005', 'Agent Green', 'agent.green@insurance.com', '9988776659', 'Central');

-- ================================================================
-- SEED DATA: customer
-- ================================================================
INSERT INTO `customer` VALUES 
('CUST001', 'John Doe', 'john@email.com', '9876543210', '123 Main St', '1990-05-15', 'Male', ''),
('CUST002', 'Alice Johnson', 'alice@email.com', '9123456789', '789 Pine Ave', '1985-08-10', 'Female', ''),
('CUST0001', 'Alice Johnson', 'alice.johnson@example.com', '9876543210', '123 Maple St', '1980-01-15', NULL, ''),
('CUST0002', 'Bob Smith', 'bob.smith@example.com', '9876543211', '234 Oak St', '1975-05-20', NULL, ''),
('CUST0003', 'Charlie Brown', 'charlie.brown@example.com', '9876543212', '345 Pine St', '1988-03-10', NULL, ''),
('CUST0004', 'David Lee', 'david.lee@example.com', '9876543213', '456 Cedar St', '1990-07-25', NULL, ''),
('CUST0005', 'Eva Green', 'eva.green@example.com', '9876543214', '567 Birch St', '1982-12-01', NULL, ''),
('CUST0006', 'Frank Wright', 'frank.wright@example.com', '9876543215', '678 Elm St', '1979-09-10', NULL, ''),
('CUST0007', 'Grace Hall', 'grace.hall@example.com', '9876543216', '789 Willow St', '1985-11-30', NULL, ''),
('CUST0008', 'Hannah Scott', 'hannah.scott@example.com', '9876543217', '890 Poplar St', '1992-04-18', NULL, ''),
('CUST0009', 'Ian King', 'ian.king@example.com', '9876543218', '901 Spruce St', '1978-06-12', NULL, ''),
('CUST0010', 'Jane Doe', 'jane.doe@example.com', '9876543219', '102 Ash St', '1983-08-15', NULL, ''),
('CUST0011', 'Kyle Young', 'kyle.young@example.com', '9876543220', '213 Fir St', '1991-02-20', NULL, ''),
('CUST0012', 'Laura Parker', 'laura.parker@example.com', '9876543221', '324 Chestnut St', '1986-10-05', NULL, ''),
('CUST0013', 'Mark Adams', 'mark.adams@example.com', '9876543222', '435 Walnut St', '1984-03-22', NULL, ''),
('CUST0014', 'Nina Clark', 'nina.clark@example.com', '9876543223', '546 Sycamore St', '1977-07-07', NULL, ''),
('CUST0015', 'Oliver Davis', 'oliver.davis@example.com', '9876543224', '657 Maple St', '1989-09-17', NULL, ''),
('CUST0016', 'Paula Edwards', 'paula.edwards@example.com', '9876543225', '768 Oak St', '1981-01-29', NULL, ''),
('CUST0017', 'Quinn Ford', 'quinn.ford@example.com', '9876543226', '879 Pine St', '1993-05-13', NULL, ''),
('CUST0018', 'Rachel Gomez', 'rachel.gomez@example.com', '9876543227', '980 Cedar St', '1987-11-22', NULL, ''),
('CUST0019', 'Steve Harris', 'steve.harris@example.com', '9876543228', '109 Birch St', '1980-04-04', NULL, ''),
('CUST0020', 'Tina Johnson', 'tina.johnson@example.com', '9876543229', '210 Elm St', '1982-06-30', NULL, '');

-- ================================================================
-- SEED DATA: policy
-- ================================================================
INSERT INTO `policy` VALUES 
('POL0001', 'Health', 500000.00, 15000.00, '2024-01-01', '2025-01-01', 'ACTIVE', NULL, NULL, NULL, NULL),
('POL0002', 'Auto', 300000.00, 10000.00, '2024-02-01', '2025-02-01', 'ACTIVE', NULL, NULL, NULL, NULL),
('POL1001', 'Life Insurance', 1000000.00, 25000.00, '2024-01-01', '2034-01-01', 'ACTIVE', NULL, NULL, NULL, NULL),
('POL1002', 'Health Insurance', 500000.00, 12000.00, '2024-02-01', '2025-02-01', 'ACTIVE', NULL, NULL, NULL, NULL),
('POL1003', 'Auto Insurance', 300000.00, 8000.00, '2024-03-01', '2025-03-01', 'ACTIVE', NULL, NULL, NULL, NULL);

-- ================================================================
-- SEED DATA: customer_policy (Junction table)
-- ================================================================
INSERT INTO `customer_policy` VALUES 
(1, 'CUST0001', 'POL1001'),
(2, 'CUST0002', 'POL1002'),
(3, 'CUST0003', 'POL1003'),
(4, 'CUST0004', 'POL1001'),
(5, 'CUST0005', 'POL1002'),
(6, 'CUST0006', 'POL1003'),
(7, 'CUST0007', 'POL1001'),
(8, 'CUST0008', 'POL1002'),
(9, 'CUST0009', 'POL1003'),
(10, 'CUST001', 'POL0001'),
(11, 'CUST0010', 'POL1001'),
(12, 'CUST0011', 'POL1002'),
(13, 'CUST0012', 'POL1003'),
(14, 'CUST0013', 'POL1001'),
(15, 'CUST0014', 'POL1002'),
(16, 'CUST0015', 'POL1003'),
(17, 'CUST0016', 'POL1001'),
(18, 'CUST0017', 'POL1002'),
(19, 'CUST0018', 'POL1003'),
(20, 'CUST0019', 'POL1001'),
(21, 'CUST002', 'POL0002'),
(22, 'CUST0020', 'POL1002');

-- ================================================================
-- SEED DATA: claim
-- ================================================================
INSERT INTO `claim` VALUES 
('CLM001', 50000.00, 'APPROVED', '2024-03-15 10:30:00', 'CUST001', 'POL0001', 'Medical emergency hospitalization', 5, NULL, NULL, 'ADM002', 24),
('CLM002', 25000.00, 'PENDING', '2024-04-20 14:45:00', 'CUST002', 'POL0002', 'Minor car accident repair', 3, NULL, NULL, NULL, NULL),
('CLM003', 100000.00, 'DECLINED', '2024-05-10 09:15:00', 'CUST0001', 'POL1001', 'Pre-existing condition claim', 2, NULL, NULL, 'ADM001', 48);

-- ================================================================
-- SEED DATA: workflows
-- ================================================================
INSERT INTO `workflows` VALUES 
('WF_CLAIM_STANDARD', 'Standard Claim Processing', 'Default workflow for regular claims under $100,000', '2024-01-01 00:00:00'),
('WF_CLAIM_HIGH_VALUE', 'High-Value Claim Processing', 'Special workflow for claims over $100,000', '2024-01-01 00:00:00');

-- ================================================================
-- SEED DATA: workflow_steps
-- ================================================================
INSERT INTO `workflow_steps` VALUES 
(1, 'WF_CLAIM_STANDARD', 1, 'Initial Review', 'MANUAL', '{"role": "adjuster", "approval_required": true}', 'PENDING', NULL),
(2, 'WF_CLAIM_STANDARD', 2, 'Document Verification', 'API', '{"endpoint": "/api/verify-documents", "timeout": 30}', 'PENDING', NULL),
(3, 'WF_CLAIM_STANDARD', 3, 'Final Approval', 'MANUAL', '{"role": "manager", "approval_required": true}', 'PENDING', NULL),
(4, 'WF_CLAIM_HIGH_VALUE', 1, 'Risk Assessment', 'RULE', '{"rules": [{"field": "claim_amount", "operator": ">", "value": 100000}]}', 'PENDING', NULL),
(5, 'WF_CLAIM_HIGH_VALUE', 2, 'Senior Manager Review', 'MANUAL', '{"role": "senior_manager", "approval_required": true}', 'PENDING', NULL);

-- Display confirmation
SELECT 'Seed data inserted successfully!' AS Status;
SELECT 
    (SELECT COUNT(*) FROM administrator) AS Administrators,
    (SELECT COUNT(*) FROM agent) AS Agents,
    (SELECT COUNT(*) FROM customer) AS Customers,
    (SELECT COUNT(*) FROM policy) AS Policies,
    (SELECT COUNT(*) FROM claim) AS Claims,
    (SELECT COUNT(*) FROM workflows) AS Workflows;
