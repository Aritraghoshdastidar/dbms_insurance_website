-- ================================================================
-- 02 - CREATE TABLES
-- ================================================================
-- Purpose: Create all database tables with proper schema
-- Dependencies: 01_create_database.sql must be run first
-- ================================================================

USE `dbms_database`;

-- ================================================================
-- TABLE: administrator
-- Purpose: Store admin user accounts with roles
-- ================================================================
DROP TABLE IF EXISTS `administrator`;
CREATE TABLE `administrator` (
  `admin_id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) DEFAULT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `role` VARCHAR(50) DEFAULT NULL COMMENT 'System Admin, Junior Adjuster, Security Officer, etc.',
  `password` VARCHAR(255) DEFAULT NULL COMMENT 'bcrypt hashed password',
  PRIMARY KEY (`admin_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Administrator accounts with role-based access';

-- ================================================================
-- TABLE: customer
-- Purpose: Store customer profiles
-- ================================================================
DROP TABLE IF EXISTS `customer`;
CREATE TABLE `customer` (
  `customer_id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) DEFAULT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `address` VARCHAR(255) DEFAULT NULL,
  `dob` DATE DEFAULT NULL,
  `gender` VARCHAR(10) DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL COMMENT 'bcrypt hashed password',
  PRIMARY KEY (`customer_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Customer profiles with authentication';

-- ================================================================
-- TABLE: agent
-- Purpose: Store insurance agent information
-- ================================================================
DROP TABLE IF EXISTS `agent`;
CREATE TABLE `agent` (
  `agent_id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) DEFAULT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `region` VARCHAR(100) DEFAULT NULL,
  PRIMARY KEY (`agent_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Insurance agents';

-- ================================================================
-- TABLE: policy
-- Purpose: Store insurance policies
-- ================================================================
DROP TABLE IF EXISTS `policy`;
CREATE TABLE `policy` (
  `policy_id` VARCHAR(50) NOT NULL,
  `policy_type` VARCHAR(50) DEFAULT NULL,
  `coverage_amount` DECIMAL(15,2) DEFAULT NULL,
  `premium_amount` DECIMAL(10,2) DEFAULT NULL,
  `start_date` DATE DEFAULT NULL,
  `end_date` DATE DEFAULT NULL,
  `status` ENUM(
    'PENDING_INITIAL_APPROVAL',
    'PENDING_FINAL_APPROVAL',
    'INACTIVE_AWAITING_PAYMENT',
    'ACTIVE',
    'DECLINED',
    'EXPIRED'
  ) DEFAULT 'PENDING_INITIAL_APPROVAL',
  `initial_approval_by` VARCHAR(50) DEFAULT NULL COMMENT 'Admin ID who did initial approval',
  `initial_approval_date` TIMESTAMP NULL DEFAULT NULL,
  `final_approval_by` VARCHAR(50) DEFAULT NULL COMMENT 'Security Officer ID who did final approval',
  `final_approval_date` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`policy_id`),
  KEY `initial_approval_by` (`initial_approval_by`),
  KEY `final_approval_by` (`final_approval_by`),
  CONSTRAINT `fk_policy_initial_admin` FOREIGN KEY (`initial_approval_by`) REFERENCES `administrator` (`admin_id`),
  CONSTRAINT `fk_policy_final_admin` FOREIGN KEY (`final_approval_by`) REFERENCES `administrator` (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Insurance policies with four-eyes approval workflow';

-- ================================================================
-- TABLE: beneficiary
-- Purpose: Store policy beneficiaries
-- ================================================================
DROP TABLE IF EXISTS `beneficiary`;
CREATE TABLE `beneficiary` (
  `beneficiary_id` VARCHAR(50) NOT NULL,
  `policy_id` VARCHAR(50) DEFAULT NULL,
  `name` VARCHAR(100) DEFAULT NULL,
  `relationship` VARCHAR(50) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `allocation_percentage` DECIMAL(5,2) DEFAULT NULL,
  PRIMARY KEY (`beneficiary_id`),
  KEY `policy_id` (`policy_id`),
  CONSTRAINT `fk_beneficiary_policy` FOREIGN KEY (`policy_id`) REFERENCES `policy` (`policy_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Policy beneficiaries';

-- ================================================================
-- TABLE: customer_policy (Junction Table)
-- Purpose: Many-to-many relationship between customers and policies
-- ================================================================
DROP TABLE IF EXISTS `customer_policy`;
CREATE TABLE `customer_policy` (
  `customer_policy_id` INT NOT NULL AUTO_INCREMENT,
  `customer_id` VARCHAR(50) NOT NULL,
  `policy_id` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`customer_policy_id`),
  KEY `fk_cp_customer` (`customer_id`),
  KEY `fk_cp_policy` (`policy_id`),
  CONSTRAINT `fk_cp_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`),
  CONSTRAINT `fk_cp_policy` FOREIGN KEY (`policy_id`) REFERENCES `policy` (`policy_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Customer-Policy relationship (many-to-many)';

-- ================================================================
-- TABLE: agent_policy (Junction Table)
-- Purpose: Many-to-many relationship between agents and policies
-- ================================================================
DROP TABLE IF EXISTS `agent_policy`;
CREATE TABLE `agent_policy` (
  `agent_policy_id` INT NOT NULL AUTO_INCREMENT,
  `agent_id` VARCHAR(50) NOT NULL,
  `policy_id` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`agent_policy_id`),
  KEY `fk_ap_agent` (`agent_id`),
  KEY `fk_ap_policy` (`policy_id`),
  CONSTRAINT `fk_ap_agent` FOREIGN KEY (`agent_id`) REFERENCES `agent` (`agent_id`),
  CONSTRAINT `fk_ap_policy` FOREIGN KEY (`policy_id`) REFERENCES `policy` (`policy_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Agent-Policy assignment (many-to-many)';

-- ================================================================
-- TABLE: claim
-- Purpose: Store insurance claims
-- ================================================================
DROP TABLE IF EXISTS `claim`;
CREATE TABLE `claim` (
  `claim_id` VARCHAR(50) NOT NULL,
  `claim_amount` DECIMAL(15,2) DEFAULT NULL,
  `claim_status` VARCHAR(50) DEFAULT 'PENDING',
  `claim_date` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `customer_id` VARCHAR(50) DEFAULT NULL,
  `policy_id` VARCHAR(50) DEFAULT NULL,
  `description` TEXT,
  `risk_score` INT DEFAULT 0 COMMENT 'Risk assessment score (0-10)',
  `workflow_id` VARCHAR(50) DEFAULT NULL,
  `current_step` INT DEFAULT NULL,
  `assigned_to` VARCHAR(50) DEFAULT NULL COMMENT 'Admin ID assigned to process',
  `processing_time` INT DEFAULT NULL COMMENT 'Processing time in hours',
  PRIMARY KEY (`claim_id`),
  KEY `customer_id` (`customer_id`),
  KEY `policy_id` (`policy_id`),
  KEY `assigned_to` (`assigned_to`),
  CONSTRAINT `fk_claim_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`),
  CONSTRAINT `fk_claim_policy` FOREIGN KEY (`policy_id`) REFERENCES `policy` (`policy_id`),
  CONSTRAINT `fk_claim_admin` FOREIGN KEY (`assigned_to`) REFERENCES `administrator` (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Insurance claims with workflow integration';

-- ================================================================
-- TABLE: payment
-- Purpose: Store payment transactions
-- ================================================================
DROP TABLE IF EXISTS `payment`;
CREATE TABLE `payment` (
  `payment_id` VARCHAR(50) NOT NULL,
  `customer_policy_id` INT DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT NULL,
  `payment_date` TIMESTAMP NULL DEFAULT NULL,
  `payment_mode` VARCHAR(30) DEFAULT NULL,
  PRIMARY KEY (`payment_id`),
  KEY `fk_payment_customer_policy` (`customer_policy_id`),
  CONSTRAINT `fk_payment_customer_policy` FOREIGN KEY (`customer_policy_id`) REFERENCES `customer_policy` (`customer_policy_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Payment transactions';

-- ================================================================
-- TABLE: reminder
-- Purpose: Store notifications and reminders
-- ================================================================
DROP TABLE IF EXISTS `reminder`;
CREATE TABLE `reminder` (
  `notification_id` VARCHAR(50) NOT NULL,
  `notification_date` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `status` VARCHAR(20) DEFAULT 'PENDING',
  `message` TEXT,
  `type` VARCHAR(50) DEFAULT NULL COMMENT 'CLAIM_UPDATE, POLICY_RENEWAL, PAYMENT_DUE, etc.',
  `customer_id` VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (`notification_id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `fk_reminder_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Notification and reminder system';

-- ================================================================
-- TABLE: admin_reminder (Junction Table)
-- Purpose: Link reminders to admins
-- ================================================================
DROP TABLE IF EXISTS `admin_reminder`;
CREATE TABLE `admin_reminder` (
  `id` VARCHAR(50) NOT NULL,
  `notification_id` VARCHAR(50) DEFAULT NULL,
  `admin_id` VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notification_id` (`notification_id`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `admin_reminder_ibfk_1` FOREIGN KEY (`notification_id`) REFERENCES `reminder` (`notification_id`),
  CONSTRAINT `admin_reminder_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `administrator` (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Admin-specific reminders';

-- ================================================================
-- TABLE: audit_log
-- Purpose: Track sensitive user actions for compliance
-- ================================================================
DROP TABLE IF EXISTS `audit_log`;
CREATE TABLE `audit_log` (
  `audit_log_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(50) NOT NULL,
  `user_type` ENUM('CUSTOMER', 'ADMIN') NOT NULL,
  `action_type` VARCHAR(100) NOT NULL,
  `entity_id` VARCHAR(50) DEFAULT NULL COMMENT 'ID of affected entity (claim_id, policy_id, etc.)',
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `details` JSON DEFAULT NULL COMMENT 'Optional details like data before/after change'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Audit log for sensitive user actions and compliance';

-- ================================================================
-- TABLE: workflows
-- Purpose: Define workflow templates
-- ================================================================
DROP TABLE IF EXISTS `workflows`;
CREATE TABLE `workflows` (
  `workflow_id` VARCHAR(50) NOT NULL,
  `workflow_name` VARCHAR(100) DEFAULT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`workflow_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Workflow definitions';

-- ================================================================
-- TABLE: workflow_steps
-- Purpose: Define workflow step configurations
-- ================================================================
DROP TABLE IF EXISTS `workflow_steps`;
CREATE TABLE `workflow_steps` (
  `step_id` INT NOT NULL AUTO_INCREMENT,
  `workflow_id` VARCHAR(50) DEFAULT NULL,
  `step_number` INT DEFAULT NULL,
  `step_name` VARCHAR(100) DEFAULT NULL,
  `step_type` ENUM('MANUAL', 'API', 'RULE', 'TIMER') DEFAULT 'MANUAL',
  `configuration` JSON DEFAULT NULL COMMENT 'Step-specific configuration',
  `status` VARCHAR(20) DEFAULT 'PENDING',
  `due_date` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`step_id`),
  KEY `workflow_id` (`workflow_id`),
  CONSTRAINT `fk_workflow_steps` FOREIGN KEY (`workflow_id`) REFERENCES `workflows` (`workflow_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Workflow step definitions with JSON configuration';

-- Display confirmation
SELECT 'All 14 tables created successfully!' AS Status;
