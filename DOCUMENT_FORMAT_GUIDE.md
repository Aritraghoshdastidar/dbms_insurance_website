# Document Processor - Document Format Guide

## ✅ Correct Document Format

### **Basic Format (Minimum Required):**
```
Claim ID: CLM2024001
Amount: $5,500
```

### **Recommended Format (With Policy ID):**
```
Claim ID: CLM2024001
Policy ID: POL1002
Amount: $5,500
```

### **Full Format Example:**
```
Insurance Claim Document
========================

Claim ID: CLM2024001
Policy ID: POL1002
Policyholder: John Smith
Date: November 1, 2025
Type: Vehicle Accident

Claim Details:
--------------
Amount: $5,500
Description: Vehicle damage due to rear-end collision
Location: Main Street, Downtown
```

---

## ❌ Common Mistakes

### **Mistake 1: Using Policy ID as Claim ID**
```
❌ WRONG:
Claim ID: POL1001    ← This is a Policy ID, not a Claim ID!
Amount: $5,500
```

```
✅ CORRECT:
Claim ID: CLM2024001  ← Claim IDs start with CLM
Policy ID: POL1001    ← Policy IDs start with POL
Amount: $5,500
```

**Why it matters:** 
- Claim IDs and Policy IDs are different!
- Claim ID: Reference for the insurance claim (CLM...)
- Policy ID: Reference for your insurance policy (POL...)

---

### **Mistake 2: Missing Required Fields**
```
❌ WRONG:
Policyholder: John Smith
Date: November 1, 2025
Amount: $5,500
```
**Missing:** Claim ID

```
✅ CORRECT:
Claim ID: CLM2024001
Policyholder: John Smith
Date: November 1, 2025
Amount: $5,500
```

---

### **Mistake 3: Wrong Currency Format**
```
❌ WRONG:
Amount: 5500 dollars
Amount: USD 5,500
Amount: 5500.00$
```

```
✅ CORRECT:
Amount: $5,500
Amount: ₹5,500
Amount: $5,500.00
Amount: ₹125,000
```

---

## 📋 Field Specifications

### **Claim ID** (Required)
- **Pattern:** `Claim ID: [value]`
- **Format:** Usually starts with CLM followed by numbers
- **Examples:**
  - `Claim ID: CLM2024001`
  - `Claim ID: CLM001`
  - `Claim ID: CLAIM2024001`
- **Case Insensitive:** Works with "claim id", "Claim ID", "CLAIM ID"

### **Policy ID** (Optional but Recommended)
- **Pattern:** `Policy ID: [value]`
- **Format:** Usually starts with POL followed by numbers
- **Examples:**
  - `Policy ID: POL1001`
  - `Policy ID: POL_2024_001`
- **Note:** If provided, it's extracted but NOT used for auto-creation
- **Auto-creation uses:** Your active policy from the database

### **Amount** (Required)
- **Pattern:** `Amount: [currency][value]`
- **Supported Currencies:** $ (USD), ₹ (INR)
- **Formats Supported:**
  - `Amount: $5,500` ✅
  - `Amount: ₹125,000` ✅
  - `Amount: $5,500.00` ✅
  - `Amount: 5500` ✅ (without currency symbol)
  - `Amount: $5,500.50` ✅ (with decimals)
- **Commas:** Optional, will be removed during parsing

---

## 🎨 Example Documents

### **Example 1: Vehicle Accident Claim**
```
Insurance Claim Document
========================

Claim ID: CLM2024001
Policy ID: POL1002
Policyholder: John Smith
Date: November 1, 2025
Type: Vehicle Accident

Claim Details:
--------------
Amount: $5,500
Description: Vehicle damage due to rear-end collision at intersection
Location: Main Street, Downtown

Supporting Documents:
- Police Report #PR12345
- Medical Bills
- Repair Estimates

This claim requires immediate processing.
```

### **Example 2: Medical Claim**
```
INSURANCE CLAIM SUBMISSION FORM
================================

POLICYHOLDER INFORMATION:
Name: Priya Sharma
Policy Number: POL-987654
Contact: +91-9876543210

CLAIM INFORMATION:
Claim ID: CLM2024789
Date of Incident: October 28, 2025
Type of Claim: Medical Emergency

FINANCIAL DETAILS:
Amount: ₹225,500
Payment Method: Direct Transfer
Status: Pending Review

INCIDENT DESCRIPTION:
Emergency hospitalization due to sudden cardiac arrest.
Treatment included ICU admission, surgery, and post-operative care.
```

### **Example 3: Minimal Valid Document**
```
Claim ID: CLM2024999
Amount: $1,200
```

### **Example 4: Property Damage Claim**
```
Home Insurance Claim

Claim ID: CLM2024555
Policy ID: POL1003
Property Owner: Sarah Johnson
Incident Date: October 15, 2025
Type: Water Damage

Claim Amount: $15,750

Description: Burst pipe caused flooding in basement, 
damaged flooring, walls, and personal belongings.
```

---

## 🔍 What Gets Extracted

From your document, the system extracts:

1. **Claim ID** - The unique claim reference
2. **Policy ID** - The policy reference (if present)
3. **Amount** - The monetary claim value
4. **Confidence** - How confident the extraction is (always 90%)

**Example Input:**
```
Claim ID: CLM2024001
Policy ID: POL1002
Amount: $5,500
```

**Extracted Output:**
```json
{
  "claim_id": "CLM2024001",
  "policy_id": "POL1002",
  "amount": 5500,
  "confidence": 0.9
}
```

---

## ⚠️ Important Notes

### **About Policy ID in Documents:**
- **Policy ID from document** = Reference/Information only
- **Policy ID for claim creation** = Comes from your active policies in the system
- Even if document says "Policy ID: POL1001", if you only have POL1002 active, the system will use POL1002

### **Claim ID vs System Claim ID:**
- **Document Claim ID** = External reference (CLM2024001)
- **System Claim ID** = Generated by system (CLM_1730472600000)
- When auto-creating, both are shown:
  - System Claim ID: CLM_1730472600000 (created in database)
  - Document Reference: CLM2024001 (from your document)

---

## 🧪 Testing Your Documents

### **Test Checklist:**
- [ ] Document has "Claim ID: [value]" line
- [ ] Claim ID starts with CLM (not POL)
- [ ] Document has "Amount: [currency][value]" line
- [ ] Amount is a valid number
- [ ] File is saved as .txt format
- [ ] File size is under 5MB

### **Quick Test:**
Create a file `test_claim.txt`:
```
Claim ID: CLM_TEST_001
Amount: $100
```

Upload it to Document Processor and verify extraction shows:
- Claim ID: CLM_TEST_001
- Amount: ₹100
- Confidence: 90.0%

---

## 🆘 Warnings You Might See

### **Warning: Extracted Claim ID looks like a Policy ID**
```
⚠️ Warning: Extracted Claim ID looks like a Policy ID. 
Please verify the document format.
```

**Cause:** Your document has:
```
Claim ID: POL1001    ← Starts with POL
```

**Fix:** Change to:
```
Claim ID: CLM2024001    ← Starts with CLM
Policy ID: POL1001      ← Policy ID goes here
```

---

## 💡 Pro Tips

1. **Use CLM prefix** for Claim IDs to avoid confusion
2. **Include Policy ID** as separate field for reference
3. **Use clear formatting** with "Claim ID:" and "Amount:" labels
4. **Test with minimal document** first before adding details
5. **Check sample documents** provided in the project folder

---

## 📁 Sample Documents Provided

The project includes sample documents you can reference:

1. **sample_claim_document.txt** - Vehicle accident claim
2. **sample_medical_claim.txt** - Medical emergency claim

Location: Project root directory

---

## 🔄 Document Format Evolution

### **Version 1 (Original):**
```
Claim ID: CLM2024001
Amount: $5,500
```
- Basic extraction
- Two fields only

### **Version 2 (Enhanced):**
```
Claim ID: CLM2024001
Policy ID: POL1002
Amount: $5,500
```
- Added Policy ID extraction
- Warning for POL-prefixed Claim IDs
- Better validation

### **Future Versions (Planned):**
- Extract policyholder name
- Extract incident date
- Extract claim type/category
- Support PDF and image files

---

**Last Updated:** November 1, 2025
**Status:** ✅ Enhanced with Policy ID extraction and validation
