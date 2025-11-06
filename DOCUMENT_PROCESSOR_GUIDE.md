# Intelligent Document Processor Guide

## Overview
The Intelligent Document Processor (IWAS-F-013) is a feature that automatically extracts key information from insurance claim documents using pattern matching and text analysis.

## What It Does

### Purpose
The document processor automatically extracts structured data from unstructured text documents, specifically:
- **Claim ID**: Identifies the unique claim identifier
- **Amount**: Extracts monetary amounts associated with the claim
- **Confidence Score**: Provides a confidence level for the extraction accuracy

### How It Works
1. **File Upload**: User uploads a text document containing claim information
2. **Text Extraction**: The system reads the document content
3. **Pattern Matching**: Uses regular expressions to identify key fields:
   - Searches for "Claim ID:" followed by alphanumeric characters
   - Searches for "Amount:" followed by currency symbols ($, ₹) and numbers
4. **Data Display**: Shows extracted information with confidence score

## Accepted File Types

### Currently Supported
- **Text Files (.txt)** - Plain text documents

### File Requirements
- **Maximum Size**: 5 MB
- **Format**: Plain text with UTF-8 encoding
- **MIME Type**: text/plain

### Document Format Examples

#### Example 1: Basic Claim Document
```
Claim ID: CLM2024001
Amount: $5,500
```

#### Example 2: Detailed Claim Document
```
Insurance Claim Document
========================

Claim ID: CLM2024001
Policyholder: John Smith
Date: November 1, 2025
Type: Vehicle Accident

Claim Details:
--------------
Amount: $5,500
Description: Vehicle damage due to rear-end collision
```

#### Example 3: Indian Currency Format
```
Claim ID: CLM2024567
Policyholder: Rajesh Kumar
Amount: ₹125,000
Type: Medical Insurance Claim
```

## Features & Improvements Applied

### Backend (server.js)
✅ **Error Handling**: Added check for missing file uploads
✅ **File Cleanup**: Ensures uploaded files are deleted after processing
✅ **Enhanced Regex**: Improved pattern matching for both $ and ₹ currencies
✅ **Better Error Messages**: Returns specific error messages to frontend

### Frontend (DocumentProcessor.js)
✅ **File Validation**: Checks file type and size before upload
✅ **Loading State**: Shows "Processing..." indicator during upload
✅ **User Guidance**: Added information box explaining how to use the feature
✅ **Format Example**: Shows sample document format
✅ **Visual Feedback**: 
   - Green success box for extracted data
   - Red error messages for failures
   - File size display
✅ **Better Formatting**: Currency amounts formatted with locale separators

## How to Use

### Step 1: Access the Feature
1. Navigate to the Dashboard
2. Click on "Intelligent Document Processor" or "Documents" section

### Step 2: Prepare Your Document
Create a .txt file with at least one of these patterns:
```
Claim ID: [your_claim_id]
Amount: [currency_symbol][amount]
```

### Step 3: Upload
1. Click "Choose File" or the file input
2. Select your .txt file
3. Verify the file name appears
4. Click "Upload & Process"

### Step 4: Review Results
The system will display:
- **Claim ID**: Extracted claim identifier
- **Amount**: Extracted monetary amount
- **Confidence**: Extraction confidence percentage (typically 90%)

## Common Issues & Solutions

### Issue 1: "No file uploaded"
**Solution**: Make sure you've selected a file before clicking "Upload & Process"

### Issue 2: "Please upload a .txt file only"
**Solution**: The system only accepts .txt files. Convert your document to plain text format.

### Issue 3: "File size must be less than 5MB"
**Solution**: Reduce your file size or split into multiple documents.

### Issue 4: "Not found" in results
**Solution**: Make sure your document contains the exact patterns:
- `Claim ID: ` followed by the ID
- `Amount: ` followed by $ or ₹ and the number

## Technical Details

### Backend Endpoint
- **URL**: `POST /api/documents/process`
- **Content-Type**: multipart/form-data
- **Field Name**: document
- **Response Format**:
```json
{
  "message": "Document processed successfully",
  "extracted": {
    "claim_id": "CLM2024001",
    "amount": 5500,
    "confidence": 0.9
  }
}
```

### Pattern Matching Regex
- **Claim ID**: `/Claim\s*ID:\s*([\w]+)/i`
- **Amount**: `/Amount:\s*[$₹]?\s*([\d,]+(?:\.\d{2})?)/i`

### Dependencies
- **Backend**: multer (file upload handling), fs (file system operations)
- **Frontend**: axios (HTTP requests), React hooks (state management)

## Future Enhancements (Possible)

### File Type Support
- PDF documents (.pdf)
- Word documents (.docx)
- Images with OCR (.jpg, .png)

### Additional Extraction Fields
- Policyholder name
- Incident date
- Claim type/category
- Description/notes
- Supporting document references

### Advanced Features
- Machine Learning for better extraction
- Multi-language support
- Automatic claim creation after extraction
- Bulk document processing
- Document validation against policy data

## Testing

### Sample Test File
A sample document has been created at: `sample_claim_document.txt`

You can use this to test the functionality:
1. Start the backend server: `node server.js`
2. Start the frontend: `cd insurance-frontend && npm start`
3. Navigate to Document Processor
4. Upload `sample_claim_document.txt`
5. Verify extraction results

## Status
✅ **WORKING** - Feature is fully functional with improvements applied.

### Improvements Made (November 1, 2025)
1. Fixed file validation and error handling
2. Enhanced regex patterns for better extraction
3. Added file cleanup in error cases
4. Improved UI with instructions and feedback
5. Added file size and type validation
6. Enhanced visual presentation of results
