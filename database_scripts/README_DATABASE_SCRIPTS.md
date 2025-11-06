# Database Scripts - Insurance Workflow Automation System

## 📁 Folder Structure

This folder contains all SQL scripts used in the Insurance Workflow Automation project, organized by functionality.

```
database_scripts/
├── 01_create_database.sql        # Initialize database
├── 02_create_tables.sql          # Create all 14 tables with schema
├── 03_create_triggers.sql        # Create 5 automated triggers
├── 04_insert_seed_data.sql       # Insert test/demo data
├── 05_complex_queries.sql        # Complex SQL queries used in app
├── 06_crud_operations.sql        # All CRUD operation examples
├── 07_master_setup.sql           # Run all scripts in order
├── 08_create_indexes.sql         # Performance optimization indexes
├── add_admin_user.sql            # Create main admin account
├── add_security_officer.sql      # Create security officer account
├── patch_triggers.sql            # Fix duplicate reminder trigger
├── dbms_database_fixed.sql       # Complete database dump (backup)
└── triggers/
    └── IWAS-F-040.sql           # Auto-assign agent trigger
```

---

## 🚀 Quick Start

### Option 1: Master Setup (Recommended)
Run everything at once:

```bash
mysql -u root -p < 07_master_setup.sql
```

This automatically runs all scripts in the correct order.

### Option 2: Step-by-Step Setup

```bash
# Step 1: Create database
mysql -u root -p < 01_create_database.sql

# Step 2: Create tables
mysql -u root -p < 02_create_tables.sql

# Step 3: Create triggers
mysql -u root -p < 03_create_triggers.sql

# Step 4: Insert seed data
mysql -u root -p < 04_insert_seed_data.sql

# Step 5: Create admin accounts
mysql -u root -p < add_admin_user.sql
mysql -u root -p < add_security_officer.sql

# Step 6 (Optional): Create performance indexes
mysql -u root -p < 08_create_indexes.sql
```

### Option 3: Using Windows Batch Files

```powershell
# Complete setup
.\apply-db-fixes.bat

# Add admin accounts
.\add-admin.bat
.\add-security-officer.bat
```

---

## 📋 Script Details

### Core Setup Scripts

#### 01_create_database.sql
- **Purpose:** Initialize the `dbms_database` database
- **Creates:** Database with UTF-8 support
- **Safe:** Uses `CREATE DATABASE IF NOT EXISTS`

#### 02_create_tables.sql
- **Purpose:** Create complete relational schema
- **Tables Created (14 total):**
  1. `administrator` - Admin users with roles
  2. `customer` - Customer profiles
  3. `agent` - Insurance agents
  4. `policy` - Insurance policies (4-eyes approval)
  5. `beneficiary` - Policy beneficiaries
  6. `customer_policy` - Customer-Policy junction
  7. `agent_policy` - Agent-Policy junction
  8. `claim` - Insurance claims
  9. `payment` - Payment transactions
  10. `reminder` - Notifications
  11. `admin_reminder` - Admin notifications
  12. `audit_log` - Security audit trail
  13. `workflows` - Workflow definitions
  14. `workflow_steps` - Workflow step config

**Features:**
- ✅ 3NF Normalized
- ✅ Foreign key constraints
- ✅ ENUM types for status fields
- ✅ JSON fields for flexible config
- ✅ Comprehensive comments

#### 03_create_triggers.sql
- **Purpose:** Automated business logic
- **Triggers Created (5 total):**

1. **after_claim_status_update**
   - Fires: AFTER UPDATE on `claim`
   - Action: Create customer notification when status changes
   - Idempotent: Uses ON DUPLICATE KEY UPDATE

2. **after_payment_success**
   - Fires: AFTER INSERT on `payment`
   - Action: Activate policy and notify customer
   - Business Rule: Only if payment status = 'SUCCESS'

3. **after_policy_insert**
   - Fires: AFTER INSERT on `policy`
   - Action: Send welcome notification
   - Context: Links to customer via junction table

4. **policy_renewal_reminder**
   - Fires: BEFORE UPDATE on `policy`
   - Action: Create renewal reminder
   - Rule: When policy expires within 30 days

5. **after_policy_insert_assign_agent**
   - Fires: AFTER INSERT on `policy`
   - Action: Auto-assign agent (round-robin)
   - Algorithm: Least assigned agent first

#### 04_insert_seed_data.sql
- **Purpose:** Populate database with test data
- **Data Inserted:**
  - 2 Administrators
  - 5 Agents
  - 22 Customers
  - 5 Policies
  - 3 Claims
  - 2 Workflows
  - 5 Workflow Steps
  - Multiple customer-policy assignments

#### 05_complex_queries.sql
- **Purpose:** Reference SQL queries used in application
- **Query Types:**
  - ✅ Nested queries (subqueries)
  - ✅ Multi-table JOINs
  - ✅ Aggregate functions (COUNT, SUM, AVG)
  - ✅ GROUP BY with HAVING
  - ✅ Complex WHERE conditions

**Examples:**
- High-risk claims detection
- Customer policy retrieval with joins
- Workflow performance metrics
- Overdue tasks reporting

#### 06_crud_operations.sql
- **Purpose:** All CRUD operations with examples
- **Operations Covered:**

**CREATE:**
- Register customer
- File claim
- Create workflow
- Add workflow step
- Create policy with assignment

**READ:**
- Get customer policies (with JOIN)
- Get customer claims
- Get pending claims (admin view)
- Get high-risk alerts
- Get workflow with steps

**UPDATE:**
- Approve/decline claims
- Initial/final policy approval
- Activate policy after payment
- Update customer profile
- Update workflow configuration

**DELETE:**
- Delete workflow steps
- Delete workflows
- Remove policy assignments
- Clean up old notifications

**TRANSACTIONS:**
- Complex multi-table operations
- Rollback support

#### 07_master_setup.sql
- **Purpose:** One-command complete setup
- **Executes:**
  1. Create database
  2. Create tables
  3. Create triggers
  4. Insert seed data
  5. Add admin accounts
- **Output:** Beautiful ASCII banner + summary

#### 08_create_indexes.sql
- **Purpose:** Performance optimization
- **Indexes Created:**
  - Status fields (claim_status, policy_status)
  - Date fields (claim_date, end_date)
  - Foreign keys (auto-created)
  - Composite indexes for complex queries
  - Audit log indexes

---

### Admin Account Scripts

#### add_admin_user.sql
- **Creates:** Main system admin
- **Email:** admin@example.com
- **Password:** admin
- **Role:** System Admin
- **Capabilities:** Initial policy approval, claim management

#### add_security_officer.sql
- **Creates:** Security Officer account
- **Email:** security@example.com
- **Password:** security123
- **Role:** Security Officer
- **Capabilities:** Final policy approval (four-eyes principle)

---

### Maintenance Scripts

#### patch_triggers.sql
- **Purpose:** Fix duplicate reminder error
- **Problem:** Original trigger fails on repeated claim updates
- **Solution:** Use `ON DUPLICATE KEY UPDATE` pattern
- **Status:** Apply after initial setup if duplicate errors occur

#### dbms_database_fixed.sql
- **Purpose:** Complete database dump
- **Type:** Full backup with structure + data
- **Use Case:** Quick restore or deployment
- **Size:** ~548 lines

---

## 🎯 Usage Scenarios

### First-Time Setup
```bash
mysql -u root -p < 07_master_setup.sql
```

### Reset Database (Clean Slate)
```bash
mysql -u root -p -e "DROP DATABASE IF EXISTS dbms_database;"
mysql -u root -p < 07_master_setup.sql
```

### Apply Trigger Fix
```bash
mysql -u root -p dbms_database < patch_triggers.sql
```

### Add Performance Indexes
```bash
mysql -u root -p dbms_database < 08_create_indexes.sql
```

### Query Reference (Read-Only)
```bash
# Just review, don't execute
cat 05_complex_queries.sql
cat 06_crud_operations.sql
```

---

## 🔍 Database Schema Overview

### Entity Relationship
```
customer ─┬─< customer_policy >─┬─ policy ─< beneficiary
          │                      │
          └─< claim              └─< agent_policy >─ agent
                 │
                 └─> workflows >─ workflow_steps

administrator ─< audit_log
              └─< admin_reminder >─ reminder ─> customer

payment ─> customer_policy
```

### Key Relationships
- **Many-to-Many:** Customer ↔ Policy (via `customer_policy`)
- **Many-to-Many:** Agent ↔ Policy (via `agent_policy`)
- **One-to-Many:** Customer → Claims
- **One-to-Many:** Policy → Claims
- **One-to-Many:** Workflow → Workflow Steps
- **One-to-Many:** Administrator → Audit Logs

---

## 📊 Database Statistics

| Table | Purpose | Records (Seed) | Key Features |
|-------|---------|---------------|--------------|
| administrator | Admin accounts | 2-4 | Roles, bcrypt passwords |
| customer | Customer profiles | 22+ | Authentication, profiles |
| agent | Insurance agents | 5 | Region-based |
| policy | Insurance policies | 5+ | 4-eyes approval, ENUM status |
| claim | Claims | 3+ | Risk scoring, workflow integration |
| payment | Transactions | 0+ | Payment tracking |
| workflows | Workflow templates | 2 | Reusable processes |
| workflow_steps | Step definitions | 5 | JSON configuration |
| customer_policy | Junction | 22+ | Many-to-many mapping |
| agent_policy | Junction | 5+ | Agent assignments |
| beneficiary | Beneficiaries | 0+ | Allocation percentage |
| reminder | Notifications | 0+ | Auto-generated by triggers |
| admin_reminder | Admin notifications | 0+ | Admin alerts |
| audit_log | Security audit | 0+ | JSON details, compliance |

---

## 🛡️ Security Features

1. **Password Hashing:** All passwords use bcrypt ($2b$10$...)
2. **Audit Logging:** Sensitive actions logged in `audit_log`
3. **Four-Eyes Approval:** Policy approval requires two different admins
4. **Role-Based Access:** Different capabilities per admin role
5. **JSON Details:** Audit logs store before/after data

---

## 🔧 Troubleshooting

### Error: "Access denied for user 'root'@'localhost'"
**Solution:** Check MySQL credentials, update .env file

### Error: "Duplicate entry for key 'reminder.PRIMARY'"
**Solution:** Run `patch_triggers.sql` to fix

### Error: "Unknown database 'dbms_database'"
**Solution:** Run `01_create_database.sql` first

### Error: "Cannot add foreign key constraint"
**Solution:** Tables must be created in order - use `07_master_setup.sql`

### Slow Queries
**Solution:** Run `08_create_indexes.sql` for performance optimization

---

## 📚 DBMS Concepts Demonstrated

### Normalization
- ✅ **1NF:** Atomic values, no repeating groups
- ✅ **2NF:** No partial dependencies
- ✅ **3NF:** No transitive dependencies

### Constraints
- ✅ Primary Keys
- ✅ Foreign Keys
- ✅ UNIQUE constraints (email fields)
- ✅ NOT NULL constraints
- ✅ ENUM constraints (status fields)

### Advanced Features
- ✅ Triggers (5 types)
- ✅ JSON columns (flexible config)
- ✅ Transactions (ACID properties)
- ✅ Indexes (performance)
- ✅ Audit logging (compliance)

### Query Techniques
- ✅ Nested subqueries
- ✅ Multi-table JOINs (INNER, LEFT)
- ✅ Aggregate functions (COUNT, SUM, AVG, MIN, MAX)
- ✅ GROUP BY with HAVING
- ✅ CASE expressions
- ✅ Date functions (DATEDIFF, NOW, DATE_SUB)

---

## 📝 Notes

- All scripts are **idempotent** where possible (use `IF NOT EXISTS`, `DROP TABLE IF EXISTS`)
- Scripts include **comprehensive comments** for understanding
- Foreign keys ensure **referential integrity**
- Triggers provide **automated business logic**
- Seed data is for **testing/demo purposes only**
- Production deployments should use proper secrets management

---

## 👥 Team Information

**Team Name:** Logicore  
**Course:** DBMS Experiential Learning - Level 2 (Orange Problem)  
**Institution:** PES University  
**Section:** AIML Section B  
**Project ID:** P04

---

## 📞 Support

For issues or questions:
1. Check `RUBRICS_COMPLIANCE_REPORT.md` for complete analysis
2. Review `QUICK_START.md` for setup instructions
3. Consult `MYSQL_SETUP.md` for troubleshooting

---

**Last Updated:** November 1, 2025
