# Tender Type APIs

## Authentication
All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

---

## Endpoints

### 1. List Tender Types
**GET** `/api/tender-types`

Query Parameters:
- `procurementType` (optional): Filter by `goods`, `works`, or `services`

Response:
```json
{
  "success": true,
  "data": [
    {
      "code": "PG1",
      "name": "Request for Quotation - Goods (up to BDT 8 Lac)",
      "min_value_bdt": 0,
      "max_value_bdt": 800000,
      "requires_tender_security": false,
      "procurement_type": "goods",
      "min_submission_days": 3
    }
  ],
  "count": 14
}
```

---

### 2. Get Tender Type by Code
**GET** `/api/tender-types/:code`

Parameters:
- `code`: Tender type code (e.g., `PG1`, `PG2`)

Response:
```json
{
  "success": true,
  "data": {
    "code": "PG1",
    "name": "Request for Quotation - Goods (up to BDT 8 Lac)",
    "description": "Simple procurement for small goods under 8 Lac",
    "min_value_bdt": 0,
    "max_value_bdt": 800000,
    "requires_tender_security": false,
    "requires_performance_security": false,
    "min_submission_days": 3,
    "max_submission_days": null,
    "default_validity_days": 60,
    "section_count": 6
  }
}
```

---

### 3. Suggest Tender Type
**POST** `/api/tender-types/suggest`

Request Body:
```json
{
  "procurementType": "goods",
  "estimatedValue": 500000,
  "isInternational": false,
  "isEmergency": false,
  "isSingleSource": false,
  "isTurnkey": false,
  "isOutsourcingPersonnel": false
}
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "code": "PG1",
      "name": "Request for Quotation - Goods (up to BDT 8 Lac)",
      "confidence": 100,
      "reasons": [
        "Value fits 0 - 8.00 Lac",
        "No tender security required"
      ],
      "warnings": null,
      "metadata": {
        "minValue": 0,
        "maxValue": 800000,
        "requiresTenderSecurity": false,
        "minSubmissionDays": 3,
        "sectionCount": 6
      }
    }
  ],
  "recommended": {
    "code": "PG1",
    "confidence": 100
  }
}
```

---

### 4. Validate Tender Value
**POST** `/api/tender-types/validate-value`

Request Body:
```json
{
  "value": 10000000,
  "tenderTypeCode": "PG1"
}
```

Response (invalid):
```json
{
  "success": true,
  "data": {
    "valid": false,
    "message": "Value 1.00 Crore exceeds maximum for PG1 (maximum: 8.00 Lac)",
    "suggestedType": "PG2"
  }
}
```

Response (valid):
```json
{
  "success": true,
  "data": {
    "valid": true,
    "message": "Value 5.00 Lac is valid for PG1",
    "suggestedType": null
  }
}
```

---

### 5. Calculate Securities
**POST** `/api/tender-types/calculate-securities`

Request Body:
```json
{
  "tenderValue": 5000000,
  "tenderTypeCode": "PG2"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "tenderSecurity": 100000,
    "performanceSecurity": 250000,
    "retentionMoney": 0,
    "total": 350000
  }
}
```

---

### 6. Get Document Requirements
**GET** `/api/tender-types/:code/documents`

Query Parameters:
- `grouped` (optional): Set to `true` to group by category

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "code": "PG1-TECH-SPECS",
      "name": "Technical Specifications",
      "description": "Provide technical specifications of the goods",
      "is_mandatory": true,
      "category": "technical",
      "display_order": 1
    },
    {
      "id": "uuid-2",
      "code": "PG1-COMMERCIAL",
      "name": "Price Bid",
      "description": "Commercial bid with pricing",
      "is_mandatory": true,
      "category": "commercial",
      "display_order": 2
    }
  ],
  "total": 6,
  "mandatory": 4
}
```

---

### 7. Get Document Checklist (Tender-Specific)
**GET** `/api/tenders/:tenderId/document-checklist`

Response:
```json
{
  "success": true,
  "data": {
    "tenderTypeCode": "PG1",
    "mandatoryRequired": 4,
    "approved": 2,
    "rejected": 0,
    "pending": 2,
    "completionPercentage": 50,
    "details": [
      {
        "requirement": {
          "code": "PG1-TECH-SPECS",
          "name": "Technical Specifications",
          "is_mandatory": true
        },
        "status": "approved",
        "submission": {
          "id": "uuid",
          "filename": "tech_specs.pdf",
          "uploaded_at": "2026-02-07T10:30:00Z",
          "verification_status": "approved"
        }
      }
    ]
  }
}
```

---

### 8. Upload Document
**POST** `/api/tenders/:tenderId/documents/upload`

Content-Type: `multipart/form-data`

Form Fields:
- `file`: The file to upload (PDF, DOC, DOCX, JPG, PNG, XLS, XLSX)
- `documentRequirementId`: UUID of the requirement

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tender_id": "tender-uuid",
    "document_requirement_id": "req-uuid",
    "filename": "technical_specs.pdf",
    "file_path": "/uploads/tender-documents/uuid.pdf",
    "file_size": 245670,
    "mime_type": "application/pdf",
    "verification_status": "pending",
    "uploaded_at": "2026-02-07T10:30:00Z"
  }
}
```

Errors:
- File too large (> 10MB)
- File type not allowed
- Missing required fields
- Tender deadline passed
- Unauthorized (user not vendor for this tender)

---

### 9. Delete Document
**DELETE** `/api/tenders/:tenderId/documents/:submissionId`

Response:
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

Common error codes:
- `TENDER_TYPE_NOT_FOUND` (404) - Requested tender type doesn't exist
- `INVALID_VALUE` (400) - Value outside allowed range for type
- `MISSING_REQUIRED_DOCUMENTS` (400) - Cannot submit bid without all mandatory docs
- `DEADLINE_PASSED` (400) - Submission deadline has passed
- `FILE_TOO_LARGE` (413) - File exceeds 10MB limit
- `INVALID_FILE_TYPE` (400) - File type not allowed (use PDF, DOC, etc.)
- `UNAUTHORIZED` (401) - Missing or invalid authentication token
- `FORBIDDEN` (403) - User doesn't have permission (wrong org, not a vendor, etc.)
- `INTERNAL_SERVER_ERROR` (500) - Something went wrong on the server

---

## Rate Limiting

- **Standard endpoints**: 100 requests per minute per user
- **Suggestion endpoint**: 10 requests per minute per user (due to processing overhead)
- **File upload**: 5 uploads per minute per user

Rate limit headers included in response:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1707307800
```

---

## Caching

- **List tender types**: Cached for 24 hours (per procurementType filter)
- **Get tender type by code**: Cached for 24 hours
- **Document requirements**: Cached for 12 hours

Cache is automatically invalidated when tender types are updated.

---

## Example cURL Requests

### Get all tender types
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.yoursite.com/api/tender-types
```

### Get goods-related tender types
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://api.yoursite.com/api/tender-types?procurementType=goods"
```

### Suggest tender type
```bash
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "procurementType": "goods",
    "estimatedValue": 500000,
    "isInternational": false
  }' \
  https://api.yoursite.com/api/tender-types/suggest
```

### Validate value
```bash
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "value": 3000000,
    "tenderTypeCode": "PG2"
  }' \
  https://api.yoursite.com/api/tender-types/validate-value
```

### Upload document
```bash
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@technical_specs.pdf" \
  -F "documentRequirementId=req-uuid-here" \
  https://api.yoursite.com/api/tenders/tender-uuid/documents/upload
```

---

## API Versioning

Current version: **v1**

All endpoints use `/api/` prefix. Future versions will use `/api/v2/`, `/api/v3/`, etc. to maintain backward compatibility.

---

**API Documentation Last Updated**: February 7, 2026
**Maintained By**: Development Team
