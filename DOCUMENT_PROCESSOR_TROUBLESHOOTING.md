# Document Processor - Troubleshooting Guide

## ❌ Error: "Document processed, but claim creation failed: Internal server error filing claim"

This error occurs when the document is successfully processed, but the automatic claim creation fails due to policy-related issues.

---

## 🔍 Root Causes & Solutions

### **Issue 1: No Policies Linked to Your Account**

#### **Symptom:**
```
❌ Cannot auto-create claim: You don't have any policies linked to your account.
```

#### **Root Cause:**
Your customer account exists, but you don't have any records in the `customer_policy` table linking you to a policy.

#### **Solution:**
You need to purchase or be assigned a policy first:

**Option A - Check Database:**
```sql
-- Check if you have any policies
SELECT cp.*, p.policy_type, p.status 
FROM customer_policy cp
JOIN policy p ON cp.policy_id = p.policy_id
WHERE cp.customer_id = 'YOUR_CUSTOMER_ID';
```

**Option B - Add Policy Manually (Database):**
```sql
-- Link an existing policy to your account
INSERT INTO customer_policy (customer_id, policy_id)
VALUES ('YOUR_CUSTOMER_ID', 'POL1001');
```

**Option C - Use Dashboard:**
- Navigate to Dashboard → My Policies
- If you see policies with "INACTIVE_AWAITING_PAYMENT" status
- Click "Activate (Mock Pay)" button

---

### **Issue 2: No ACTIVE Policies**

#### **Symptom:**
```
❌ Cannot auto-create claim: No ACTIVE policies found. 
Your policies: POL1001 (INACTIVE_AWAITING_PAYMENT), POL1002 (EXPIRED)
```

#### **Root Cause:**
You have policies linked to your account, but none have status = 'ACTIVE'.

#### **Policy Status Types:**
- **ACTIVE** - Can be used for claims ✅
- **INACTIVE_AWAITING_PAYMENT** - Needs activation ⚠️
- **EXPIRED** - Cannot be used ❌
- **CANCELLED** - Cannot be used ❌

#### **Solution:**

**Activate a Policy:**
```sql
-- Update policy status to ACTIVE
UPDATE policy 
SET status = 'ACTIVE' 
WHERE policy_id = 'POL1001';
```

Or use the Dashboard "Activate (Mock Pay)" feature.

---

### **Issue 3: Policy Not Linked in customer_policy Table**

#### **Symptom:**
```
Policy POL1001 is not linked to your account. 
This may be a database issue - please contact support.
```

#### **Root Cause:**
The `/api/my-policies` endpoint returned a policy (maybe cached), but when creating the claim, the backend validation failed because the policy isn't in `customer_policy` table.

#### **Diagnosis:**
```sql
-- Check what policies you have
SELECT * FROM customer_policy WHERE customer_id = 'YOUR_CUSTOMER_ID';

-- Check if policy exists
SELECT * FROM policy WHERE policy_id = 'POL1001';

-- Check the join (what /api/my-policies returns)
SELECT p.policy_id, p.policy_type, p.status, cp.customer_id
FROM policy p
JOIN customer_policy cp ON p.policy_id = cp.policy_id
WHERE cp.customer_id = 'YOUR_CUSTOMER_ID';
```

#### **Solution:**
```sql
-- Link the policy to your customer account
INSERT INTO customer_policy (customer_id, policy_id)
VALUES ('YOUR_CUSTOMER_ID', 'POL1001');
```

---

### **Issue 4: Database Constraint Violation**

#### **Symptom:**
```
Invalid policy_id or customer_id. Please check your policy information.
```

#### **Root Cause:**
Foreign key constraint violation. Either:
- Policy doesn't exist in `policy` table
- Customer doesn't exist in `customer` table

#### **Diagnosis:**
```sql
-- Verify customer exists
SELECT * FROM customer WHERE customer_id = 'YOUR_CUSTOMER_ID';

-- Verify policy exists
SELECT * FROM policy WHERE policy_id = 'POL1001';

-- Check foreign key constraints
SHOW CREATE TABLE claim;
```

#### **Solution:**
```sql
-- Create missing policy (if needed)
INSERT INTO policy (policy_id, policy_type, premium_amount, status, policy_date)
VALUES ('POL1001', 'Health Insurance', 50000.00, 'ACTIVE', CURDATE());

-- Or use an existing valid policy ID
```

---

## 🛠️ Quick Diagnostics

### **Step 1: Check Your Customer ID**
Login to your account and check the browser console:
```javascript
localStorage.getItem('token')
// Decode the JWT token to see your customer_id
```

Or check the database:
```sql
SELECT customer_id, name, email FROM customer WHERE email = 'your.email@example.com';
```

---

### **Step 2: Check Your Policies**
```sql
-- See all your policies with status
SELECT 
    cp.customer_policy_id,
    cp.customer_id,
    cp.policy_id,
    p.policy_type,
    p.status,
    p.premium_amount
FROM customer_policy cp
JOIN policy p ON cp.policy_id = p.policy_id
WHERE cp.customer_id = 'YOUR_CUSTOMER_ID';
```

**Expected Result:**
At least ONE row with `status = 'ACTIVE'`

---

### **Step 3: Check Policy Table**
```sql
-- Verify active policies exist in the system
SELECT policy_id, policy_type, status, premium_amount
FROM policy
WHERE status = 'ACTIVE'
LIMIT 10;
```

---

### **Step 4: Test Claim Creation Manually**
Try creating a claim manually through the Dashboard to see if the issue is specific to auto-creation:

1. Navigate to Dashboard
2. Use "File a New Claim" form
3. Enter Policy ID, Description, Amount
4. Submit

If manual creation works but auto-creation fails, the issue is in the DocumentProcessor logic.

---

## 🔧 Complete Fix - Add Test Policy to Your Account

If you're a test user and need a quick fix:

```sql
-- 1. Find or create a test policy
INSERT INTO policy (policy_id, policy_type, premium_amount, status, policy_date, start_date, end_date)
VALUES (
    'POL_TEST_001',
    'Comprehensive Insurance',
    75000.00,
    'ACTIVE',
    CURDATE(),
    CURDATE(),
    DATE_ADD(CURDATE(), INTERVAL 1 YEAR)
)
ON DUPLICATE KEY UPDATE status = 'ACTIVE';

-- 2. Link policy to your customer account
INSERT INTO customer_policy (customer_id, policy_id)
VALUES ('YOUR_CUSTOMER_ID', 'POL_TEST_001')
ON DUPLICATE KEY UPDATE policy_id = policy_id;

-- 3. Verify
SELECT cp.*, p.status 
FROM customer_policy cp
JOIN policy p ON cp.policy_id = p.policy_id
WHERE cp.customer_id = 'YOUR_CUSTOMER_ID';
```

---

## 🎯 Frontend Improvements Applied

### **Enhanced Error Messages**
The frontend now shows detailed errors:
- Lists all your policies with their statuses
- Highlights which policy will be used for auto-creation
- Shows if no policies exist
- Shows if no ACTIVE policies exist
- Provides specific database error details

### **Policy Status Display**
When you enable "Auto-create claim", the UI now shows:
```
Your Policies:
• POL1001 - Health Insurance [ACTIVE] ← Will use this
• POL1002 - Life Insurance [INACTIVE_AWAITING_PAYMENT]
• POL1003 - Vehicle Insurance [EXPIRED]
```

### **Better Validation**
- ✅ Checks if policies array is empty
- ✅ Checks if any ACTIVE policy exists
- ✅ Uses first ACTIVE policy (not just first policy)
- ✅ Shows extracted claim reference vs system claim ID
- ✅ Logs detailed error information to console

---

## 🚀 Testing the Fix

### **Test Case 1: No Policies**
1. Login as a customer with no policies
2. Enable "Auto-create claim"
3. Should see: "⚠️ No policies found!"
4. Upload document
5. Should see error: "You don't have any policies linked to your account"

### **Test Case 2: Only Inactive Policies**
1. Login as customer with INACTIVE policies
2. Enable "Auto-create claim"
3. Should see policies list with status badges
4. Upload document
5. Should see error: "No ACTIVE policies found. Your policies: POL1001 (INACTIVE_AWAITING_PAYMENT)"

### **Test Case 3: Has Active Policy**
1. Login as customer with ACTIVE policy
2. Enable "Auto-create claim"
3. Should see: "POL1001 - Health Insurance [ACTIVE] ← Will use this"
4. Upload document
5. Should successfully create claim ✅
6. Should see: "🎉 Claim Created Successfully!"

---

## 📊 Backend Improvements Applied

### **Enhanced Validation**
```javascript
// Now checks:
1. Policy exists in customer_policy table
2. Policy exists in policy table
3. Policy status (logs it)
4. Provides specific error messages
5. Logs detailed error information
```

### **Better Error Messages**
```javascript
// Before:
"Internal server error filing claim."

// After:
"Policy POL1001 is not linked to your account. This may be a database issue."
"Policy POL1001 not found in system."
"Invalid policy_id or customer_id. Please check your policy information."
```

### **Detailed Logging**
```javascript
console.log(`Claim filing: Customer ${customer_id}, Policy ${policy_id} (${status}), Amount ${amount}`);
console.error('Error details:', { message, code, sqlMessage, sql });
```

---

## 📝 Common Scenarios

### **Scenario A: New User**
**Problem:** Just registered, no policies
**Solution:** 
1. Admin needs to assign policies in `customer_policy` table
2. Or use mock payment to activate a policy
3. Or manually link policy via SQL

### **Scenario B: Existing User, Policy Expired**
**Problem:** Had policy, but it expired
**Solution:**
1. Renew policy (update status to ACTIVE)
2. Or purchase new policy
3. Or manually update expiry date

### **Scenario C: Data Migration**
**Problem:** Customer data migrated, but `customer_policy` links missing
**Solution:**
1. Run migration script to create `customer_policy` records
2. Link all customers to appropriate policies
3. Verify with test claims

---

## 🆘 Still Having Issues?

### **Enable Debug Mode**
Open browser console (F12) when uploading document. You'll see:
```javascript
Creating claim with policy: POL1001
Error auto-creating claim: [error object]
Error details: {error: "Policy POL1001 does not belong to this customer"}
```

### **Check Server Logs**
Backend now logs:
```
Claim filing: Customer CUST0001, Policy POL1001 (ACTIVE), Amount 5500
Policy validation failed: Policy POL1001 does not belong to customer CUST0002
Error details: { message: "...", code: "ER_NO_REFERENCED_ROW_2", ... }
```

### **Manual Workaround**
If auto-creation keeps failing:
1. Disable "Auto-create claim" checkbox
2. Upload document to extract data
3. Copy Claim ID and Amount
4. Manually file claim using Dashboard form
5. Enter valid Policy ID from "My Policies" section

---

## ✅ Verification Checklist

Before trying auto-creation, verify:

- [ ] You are logged in as a **customer** (not admin)
- [ ] You have at least ONE policy in `customer_policy` table
- [ ] That policy has status = **'ACTIVE'** in `policy` table
- [ ] Policy hasn't expired (`end_date` > today)
- [ ] Your JWT token is valid (not expired)
- [ ] Backend server is running on port 3001
- [ ] Frontend can access backend (no CORS errors)

---

**Last Updated:** November 1, 2025
**Status:** ✅ Enhanced with better error handling and policy validation
