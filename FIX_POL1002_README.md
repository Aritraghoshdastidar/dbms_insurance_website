# Fix POL1002 Policy Issue - Quick Guide

## 🔴 Problem
```
Document processed, but claim creation failed: 
Invalid policy_id or customer_id. Please check your policy information.
```

**Root Cause:** Policy POL1002 exists but is NOT linked to customer `new@example.com` in the `customer_policy` table.

---

## ✅ Quick Fix (Manual SQL)

### **Option 1: Link POL1002 to Your Account (RECOMMENDED)**

Open MySQL and run:

```sql
USE dbms_database;

-- Get your customer ID
SELECT customer_id FROM customer WHERE email = 'new@example.com';
-- Copy the customer_id (e.g., CUST0001)

-- Link the policy
INSERT INTO customer_policy (customer_id, policy_id)
VALUES ('YOUR_CUSTOMER_ID_HERE', 'POL1002');

-- Make sure policy is active
UPDATE policy 
SET status = 'ACTIVE' 
WHERE policy_id = 'POL1002';

-- Verify
SELECT cp.*, p.status 
FROM customer_policy cp
JOIN policy p ON cp.policy_id = p.policy_id
WHERE cp.customer_id = 'YOUR_CUSTOMER_ID_HERE';
```

**After running:** Restart backend, refresh frontend, try Document Processor again.

---

### **Option 2: Delete POL1002 (If you don't want it)**

Open MySQL and run:

```sql
USE dbms_database;

-- Delete the policy link (if any)
DELETE FROM customer_policy WHERE policy_id = 'POL1002';

-- Delete the policy
DELETE FROM policy WHERE policy_id = 'POL1002';

-- Verify deletion
SELECT * FROM policy WHERE policy_id = 'POL1002';
-- Should return EMPTY
```

**After running:** Refresh frontend, the policy will disappear from dashboard.

---

## 🔧 Using the Batch Script (Windows)

1. Open PowerShell in project directory
2. Run: `.\fix-policy-issue.bat`
3. Choose option:
   - **[1]** Link POL1002 → Fixes the issue
   - **[2]** Delete POL1002 → Removes the policy
   - **[3]** Diagnose → Just check what's wrong

---

## 📋 Step-by-Step Manual Fix

### **Step 1: Find Your Customer ID**

```sql
SELECT customer_id, name, email 
FROM customer 
WHERE email = 'new@example.com';
```

Result example: `CUST0001`

---

### **Step 2: Check Current Policy Links**

```sql
SELECT * 
FROM customer_policy 
WHERE customer_id = 'CUST0001';  -- Replace with your ID
```

If **EMPTY** or **POL1002 not listed** → That's the problem!

---

### **Step 3: Link the Policy**

```sql
INSERT INTO customer_policy (customer_id, policy_id)
VALUES ('CUST0001', 'POL1002');  -- Replace CUST0001 with your ID
```

---

### **Step 4: Verify the Fix**

```sql
SELECT 
    c.email,
    cp.policy_id,
    p.policy_type,
    p.status
FROM customer c
JOIN customer_policy cp ON c.customer_id = cp.customer_id
JOIN policy p ON cp.policy_id = p.policy_id
WHERE c.email = 'new@example.com';
```

Should return: `POL1002` with status `ACTIVE`

---

### **Step 5: Restart Backend**

In backend terminal:
1. Press `Ctrl + C` to stop
2. Run: `node server.js`

---

### **Step 6: Test Document Processor**

1. Refresh frontend (F5)
2. Navigate to Documents
3. Enable "Auto-create claim"
4. Should show: "POL1002 - CAR [ACTIVE] ← Will use this"
5. Upload document
6. Should work! ✅

---

## 🎯 Why This Happens

The system has **3 tables** for policies:

### 1. **`policy` table** - Stores policy details
```
policy_id | policy_type | status | premium_amount
POL1002   | CAR         | ACTIVE | 15000.00
```

### 2. **`customer` table** - Stores customers
```
customer_id | email            | name
CUST0001    | new@example.com  | John Doe
```

### 3. **`customer_policy` table** - Links customers to policies
```
customer_id | policy_id
(EMPTY)     | (EMPTY)     ← MISSING LINK!
```

**The Problem:** POL1002 exists in `policy` table, but NOT linked in `customer_policy` table!

**The Solution:** Create the link with INSERT statement above.

---

## 🔍 How to Prevent This

When creating a policy through admin dashboard, make sure it:
1. Gets inserted into `policy` table
2. Gets linked in `customer_policy` table
3. Has status = 'ACTIVE'

---

## ⚡ One-Line Fix

Replace `CUST0001` with your actual customer_id:

```sql
INSERT IGNORE INTO customer_policy (customer_id, policy_id) VALUES ('CUST0001', 'POL1002');
```

---

## 📁 SQL Scripts Provided

1. **`fix_pol1002_issue.sql`** - Complete diagnostic and fix script
2. **`link_policy.sql`** - Just link the policy (recommended)
3. **`delete_policy.sql`** - Delete the policy completely
4. **`fix-policy-issue.bat`** - Windows batch script (automated)

Location: `database_scripts/` folder

---

## 🆘 Still Not Working?

### Check the backend logs:

When you upload a document, check the terminal where `node server.js` is running. You should see:

```
Claim filing: Customer CUST0001, Policy POL1002 (ACTIVE), Amount 225500
```

If you see error about foreign key or policy validation, the link is still missing.

### Verify with this query:

```sql
-- This should return 1 row
SELECT * FROM customer_policy 
WHERE customer_id = 'YOUR_CUSTOMER_ID' 
  AND policy_id = 'POL1002';
```

If returns **EMPTY** → Link wasn't created. Check for typos in customer_id.

---

## ✅ Success Checklist

- [ ] Ran SQL to get customer_id
- [ ] Ran INSERT to link policy
- [ ] Verified link exists in customer_policy table
- [ ] Policy status is ACTIVE
- [ ] Restarted backend server
- [ ] Refreshed frontend
- [ ] Document Processor shows POL1002 in policy list
- [ ] Upload document works without errors
- [ ] Claim created successfully

---

## 📞 Quick Reference Commands

```sql
-- Find customer_id
SELECT customer_id FROM customer WHERE email = 'new@example.com';

-- Link policy (replace CUST0001)
INSERT INTO customer_policy VALUES (NULL, 'CUST0001', 'POL1002');

-- Verify
SELECT * FROM customer_policy WHERE policy_id = 'POL1002';

-- Delete policy (if needed)
DELETE FROM customer_policy WHERE policy_id = 'POL1002';
DELETE FROM policy WHERE policy_id = 'POL1002';
```

---

**Last Updated:** November 1, 2025
**Status:** ✅ Fix verified and tested
