# Tender Mode Clarification Questions

## Current State Analysis

1. **Bangladesh e-GP Tender Types** have been implemented:
   - Database tables: `tender_type_definitions`, `tender_type_document_requirements`
   - Backend services: `tenderTypeSelector.service.ts`, `valueValidation.service.ts`, `securityCalculation.service.ts`, `documentChecklist.service.ts`
   - Frontend: Tender creation form uses Bangladesh tender types (PG1, PG2, etc.) with value ranges and special flags.

2. **Existing Tender Schema** (`tenders` table) includes fields for generic procurement (title, procurement_type, visibility, fund_allocation, bid_security_amount, etc.) but lacks many fields needed for Detailed RFT (government compliance) and Simple RFQ (non-government).

## Key Decisions Needed

### 1. Relationship between Bangladesh Tender Types and Simple RFQ/Detailed RFT

**Option A:** Bangladesh tender types are only for government procurement (Detailed RFT). Simple RFQ would be a separate mode with its own field set, possibly using a different tender type classification (e.g., "RFQ" vs "TENDER").

**Option B:** Bangladesh tender types encompass both simple and detailed procurement:
   - PG1 could be considered Simple RFQ (value ≤ 8 Lac, no security)
   - PG2/PG3/PG4 could be Detailed RFT (more compliance)
   - However, the field requirements differ significantly (e.g., Simple RFQ needs Buyer Info, RFQ Reference No, RFQ Type, Item Details, Commercial Basics, etc.)

**Option C:** Introduce a new attribute `tender_mode` (`simple_rfq`, `detailed_rft`, `live_auction`) that determines which additional fields are required, while still using Bangladesh tender types for government procurement.

**Question:** Should Simple RFQ be mapped to existing Bangladesh tender types (PG1) or be a completely separate classification?

### 2. Field Requirements for Each Mode

**Simple RFQ** fields (based on your specification):
- Buyer Info (Buyer Name, Company, Email, Phone, Delivery City)
- RFQ Details (Title, Reference No, RFQ Type, Issue Date, Quote Submission Deadline)
- Item Details (repeatable)
- Commercial Basics (Expected Delivery Date, Delivery Location, Payment Term, Currency, Tax Included)
- Attachments
- Vendor Response Fields (Unit Price, Total Price, Delivery Time, Validity of Quote, Remarks)

**Detailed RFT** fields (government compliance):
- Procuring Entity Details (Organization Name, Department, Procurement Type, Tender Category, Reference No, Funding Source)
- Tender Timeline (Issue Date, Pre-Bid Meeting Date, Clarification Deadline, Submission Deadline, Bid Opening Date, Expected Award Date)
- Scope of Work / Supply (Detailed Description, Technical Scope Document)
- Lot/Item Breakdown (repeatable with technical specifications)
- Commercial Terms (Delivery Schedule, Delivery Location, Contract Duration, Warranty, Liquidated Damages, Performance Security)
- Financial Terms (Bid Currency, Price Validity, Payment Milestones, Tax & VAT, Price Adjustment)
- Vendor Eligibility & Qualification (Legal Status, Trade License, Tax Certificate, VAT Registration, Bank Solvency, Similar Experience, Past Project References)
- Bid Security (EMD) details
- Evaluation Criteria (Technical/Financial Weightage, Award Method)
- Legal Declarations
- Submission Format (Technical Bid Upload, Financial Bid Upload)
- Authority & Contact

**Question:** Should we extend the existing `tenders` table with columns for all these fields, or create separate JSONB columns (`simple_rfq_data`, `detailed_rft_data`) to store mode-specific fields?

### 3. Live Tendering Architecture

**Core Requirements:**
- Scheduled start time and fixed duration
- Real-time auction-style bidding (reverse auction for procurement)
- Vendor pre-selection for limited tendering
- Real-time updates via WebSockets/Server-Sent Events

**Question:** Should live tendering be a separate `tender_mode` or an attribute that can be applied to any tender type (Simple RFQ, Detailed RFT)?

### 4. Limited Tendering

**Requirement:** Buyer selects which vendors are allowed to bid.

**Question:** Should limited tendering be an option within any tender mode, or only for Detailed RFT (government)?

## Proposed Next Steps

1. Decide on mapping approach (Option A, B, or C).
2. Design schema changes:
   - Add `tender_mode` column to `tenders`
   - Add JSONB columns for mode-specific data OR add new tables for extended attributes
   - Create `live_bidding_sessions` table for live tendering
   - Create `limited_tender_vendors` table for vendor pre-selection
3. Update frontend to include tender mode selection dashboard (Simple RFQ, Detailed RFT, Live Tendering).
4. Implement separate creation forms for each mode.
5. Integrate live tendering real-time features.

## Your Feedback Requested

Please provide guidance on the above questions and confirm the direction before we proceed with detailed planning.

- Which mapping option do you prefer?
- Should we store mode-specific fields as JSONB or separate tables?
- Any additional requirements for live tendering?
- Any other considerations?