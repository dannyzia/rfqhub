**TECHNICAL PRODUCT REQUIREMENTS DOCUMENT**

**Online RFQ & Tendering Platform**

Version 3.2 \| February 2026

Developer-Ready Specification

Status: DRAFT \| Classification: Confidential

**Changelog v3.2:**
- Clarified two bunches: Govt (Detailed RFT, Bangladesh e-GP) and Non-govt (Simple RFQ); govt buyers see only govt types, non-govt only non-govt types. Live tendering is an option at creation for any type, not a separate dashboard mode.
- Added Tender Modes: Simple RFQ, Detailed RFT, Live Tendering
- Added Limited Tendering with vendor pre-selection
- Added Live Auction functionality with real-time bidding
- Added tender_mode column to tenders table
- Added extended_data JSONB column for mode-specific fields
- Added live_bidding_sessions table for auction management
- Added limited_tender_vendors table for vendor invitations
- Updated tender status state machine for live auction states
- Added SSE (Server-Sent Events) for real-time bid updates

**Changelog v3.1:**
- Added SvelteKit as recommended frontend (better performance for form-heavy workflows)
- Added API endpoint specifications with OpenAPI structure
- Added file upload limits and validation rules
- Added multiple evaluator score aggregation rules
- Added password policy and session management details
- Added BoM hierarchy depth limits
- Added TypeScript requirement throughout

Table of Contents

1\. Overview & Purpose

This Technical Product Requirements Document (PRD) defines the complete specification for an Online RFQ & Tendering Platform. It is written to be developer-ready: every data model, state machine, permission rule, API contract hint, and non-functional constraint is documented so that engineering teams can plan sprints directly from this document.

The platform enables Buyers to float Requests for Quotation (RFQ) or formal Tenders --- open to the market or limited to an invited set of vendors. Vendors submit structured technical and commercial bids. Evaluators assess compliance and pricing through a two-stage workflow. The entire lifecycle is auditable, tamper-evident, and extensible.

1.1 Document Conventions

- PK = Primary Key, FK = Foreign Key, UUID = v4 unique identifier.

- All monetary fields use NUMERIC(18,2) unless stated otherwise.

- All timestamps are TIMESTAMPTZ (UTC). Timezone conversion is a UI concern only.

- \"Nullable\" means the column permits NULL; all other columns are NOT NULL by default.

- Enum values are listed explicitly; the database enforces them via CHECK or a lookup table.

2\. Goals & Non-Goals

2.1 Goals

- Digitize the full RFQ & Tender lifecycle: creation → publication → bidding → evaluation → award.

- Support structured specifications with selectable feature groups and hierarchical Bill of Materials (BoM).

- Enable both open (market-wide) and limited (invited vendor) tender modes.

- Guarantee auditability via immutable logs, bid integrity hashing, and envelope-based price masking.

- Provide a two-stage evaluation workflow (Technical first, then Commercial) with a compliance comparison matrix.

- Deliver a full Clarification & Addenda module so vendors can ask questions and buyers can issue official amendments.

- Implement a vendor enlistment and approval workflow with document management and expiry tracking.

- Be extensible for future modules: e-Auction, reverse bidding, ERP sync, spend analytics.

2.2 Non-Goals (Phase 1)

- Automated contract signing --- digital hash is used for submission integrity only.

- Integrated payment processing or escrow.

- AI-based bid evaluation --- scoring is rule-based and evaluator-driven only.

- ERP integration (SAP / Oracle PO upload).

- Multi-language support (Phase 1 is English-only).

2.3 File Upload Constraints

|                        |                |                                                                     |
|------------------------|----------------|---------------------------------------------------------------------|
| **File Type**          | **Max Size**   | **Allowed Extensions**                                              |
| Vendor Documents       | 10 MB          | .pdf, .jpg, .jpeg, .png                                             |
| Bid Attachments        | 25 MB          | .pdf, .doc, .docx, .xls, .xlsx, .jpg, .jpeg, .png, .zip             |
| Tender Specifications  | 50 MB          | .pdf, .doc, .docx, .xls, .xlsx, .dwg, .zip                          |
| Profile Logo/Images    | 2 MB           | .jpg, .jpeg, .png, .svg                                             |

- All uploads are scanned for malware before storage.
- File names are sanitized (alphanumeric + hyphens only, max 100 chars).
- Original filename stored in metadata; storage uses UUID-based naming.

2.4 Password & Authentication Policy

|                        |                                                                     |
|------------------------|---------------------------------------------------------------------|
| **Requirement**        | **Specification**                                                   |
| Minimum Length         | 12 characters                                                       |
| Complexity             | At least 1 uppercase, 1 lowercase, 1 digit, 1 special character     |
| Password History       | Cannot reuse last 5 passwords                                       |
| Expiry                 | 90 days (configurable per tenant)                                   |
| Lockout                | 5 failed attempts → 15-minute lockout                               |
| JWT Access Token       | 15 minutes expiry                                                   |
| JWT Refresh Token      | 7 days expiry, single-use, rotated on each refresh                  |
| Session Concurrency    | Max 3 active sessions per user (oldest auto-terminated)             |

2.5 Tender Modes

The platform supports two bunches of tender types. Government buyers see and can create only government (Detailed RFT) types; non-government buyers see and can create only non-government types (e.g. Simple RFQ). Live tendering is an option the buyer selects at creation time for any tender type (govt or non-govt), not a separate tender type on the dashboard.

**Bunch 1 — Government procurement:** Already developed. Uses Bangladesh e-GP tender types (PG1–PG9A, PW1–PW3, PPS2–PPS6). Only government buyers see and can create these. Creation flow = Detailed RFT (procuring entity, timeline, scope, commercial/financial terms, eligibility, bid security, evaluation, etc.).

**Bunch 2 — Non-government procurement:** Non-govt types (e.g. Simple RFQ). Only non-government buyers see and can create these. Creation flow = Simple RFQ (buyer info, RFQ details, items, commercial basics).

**Live tendering:** Available for any tender type (govt or non-govt). At the time of creating a tender, the buyer may enable live tendering (scheduled start/end, duration, bidding type, optional limited vendor list). No separate "Live Tendering" choice on the dashboard.

**Organization Type & Tender Type Mapping:**

| **Organization Type** | **Available Tender Types (bunch)** | **Live option at creation** |
|-----------------------|------------------------------------|-----------------------------|
| Government            | Govt types only (Detailed RFT, Bangladesh e-GP) | Yes, optional |
| Non-Government       | Non-govt types only (e.g. Simple RFQ)          | Yes, optional |

**Tender Mode Details:**

| **Mode**         | **Use Case**                                                                 | **Target Users**              | **Key Characteristics**                                                                 |
|------------------|------------------------------------------------------------------------------|-------------------------------|----------------------------------------------------------------------------------------|
| **Simple RFQ**   | Quick commercial purchases (office supplies, IT gear, small services)          | Non-government organizations  | Speed > compliance, streamlined fields, auto-publish, minimal documentation           |
| **Detailed RFT** | Government compliance, large projects, construction, hospital, infrastructure | Government organizations      | Audit-ready, full compliance with Bangladesh Public Procurement Rules 2025, two-envelope bids |
| **Live Tendering** | Optional at creation for any type; real-time auction bidding                | Any organization (govt or non-govt) | Scheduled start/end, real-time updates, vendor pre-selection (limited mode); selected when creating a tender |

**2.5.1 Simple RFQ Mode**

Simple RFQ is designed for quick procurement where speed is prioritized over extensive compliance requirements.

**Required Fields:**

- **Buyer Information**: Buyer Name, Company/Organization Name, Email, Phone (optional), Delivery City/Location
- **RFQ Details**: RFQ Title, RFQ Reference No (auto-generated), RFQ Type (Goods/Services), Issue Date (auto), Quote Submission Deadline
- **Item Details** (repeatable): Item Name/Description, Category, Quantity, Unit, Specification/Notes (short text)
- **Commercial Basics**: Expected Delivery Date, Delivery Location, Payment Term (Advance/Net 7/Net 30/On Delivery), Currency, Tax Included (Yes/No)
- **Attachments** (Optional): Image/simple spec PDF
- **Vendor Response Fields**: Unit Price, Total Price (auto), Delivery Time, Validity of Quote (days), Remarks

**Workflow:**
- Auto-publishes on creation
- No bid security required
- Single-envelope bid submission
- Direct price comparison for award

**2.5.2 Detailed RFT Mode**

Detailed RFT is designed for government compliance and audit-ready procurement processes.

**Required Fields:**

- **Procuring Entity Details**: Organization Name, Department/Division, Procurement Type (Open/Limited/Direct), Tender Category (Goods/Works/Services), Tender Reference No, Funding Source (Govt/Donor/Own Fund)
- **Tender Timeline**: Issue Date, Pre-Bid Meeting Date (optional), Clarification Deadline, Submission Deadline, Bid Opening Date, Expected Award Date
- **Scope of Work/Supply**: Tender Title, Detailed Description (long text/rich text), Technical Scope Document (upload)
- **Lot/Item Breakdown** (repeatable): Lot No, Item Code, Item Description, Technical Specification (mandatory), Quantity, Unit, Inspection Method (if any)
- **Commercial Terms**: Delivery Schedule, Delivery Location(s), Contract Duration (if service), Warranty/Defect Liability Period, Liquidated Damages (%), Performance Security Required (Yes/No), Performance Security Amount (%)
- **Financial Terms**: Bid Currency, Price Validity (days), Payment Milestones, Tax & VAT Details, Price Adjustment Allowed (Yes/No)
- **Vendor Eligibility & Qualification**: Legal Status (Company/Partnership/Individual), Trade License Upload, Tax Certificate Upload, VAT Registration Upload, Bank Solvency Certificate, Similar Experience (years), Past Project References (repeatable)
- **Bid Security (EMD)**: Bid Security Required, Amount, Form (Bank Guarantee/Pay Order), Validity Period, Upload Proof
- **Evaluation Criteria**: Technical Evaluation (Pass/Fail or Points), Financial Evaluation Method, Weightage (e.g., 70% Technical/30% Price), Award Method (L1/QCBS/Single Lot)
- **Legal & Declarations**: Acceptance of Tender Conditions (checkbox), Conflict of Interest Declaration, Anti-Collusion Declaration, Blacklisting Declaration
- **Submission Format**: Technical Bid Upload, Financial Bid Upload (separate, sealed logic)
- **Authority & Contact**: Tender Inviting Authority Name, Designation, Contact Email, Contact Phone

**Workflow:**
- Two-envelope bid submission (Technical + Commercial)
- Bid security required (configurable)
- Vendor eligibility verification
- Technical evaluation first, then commercial
- Full audit trail for compliance

**2.5.3 Live Tendering Mode**

Live tendering is an **option** selected at creation time for either a government (Detailed RFT) or non-government (Simple RFQ) tender. It is not a separate tender type visible on the dashboard. When enabled, it provides real-time auction-style bidding with scheduled sessions.

**Required Fields:**

- All fields from parent tender mode (Simple RFQ or Detailed RFT)
- **Live Bidding Configuration**: Scheduled Start Time, Duration (30-480 minutes), Bidding Type (Sealed/Open Reverse/Open Auction), Minimum Bid Increment (for open auctions)
- **Limited Tendering** (optional): Vendor pre-selection list for limited participation

**Bidding Types:**

| **Type**           | **Description**                                                                 |
|---------------------|---------------------------------------------------------------------------------|
| **Sealed**          | Vendors submit bids without seeing others' bids until auction ends             |
| **Open Reverse**    | Vendors see current lowest bid and can submit lower prices (reverse auction)    |
| **Open Auction**    | Vendors see current highest bid and can submit higher prices (forward auction)  |

**Workflow:**
- Tender created and published ahead of time
- Bidding starts automatically at scheduled time
- Real-time bid updates via Server-Sent Events (SSE)
- Bidding ends automatically at scheduled time
- Winner determined based on auction rules and evaluation criteria
- Full audit log with timestamps for all bid events

**2.5.4 Limited Tendering**

Limited tendering allows buyers to pre-select specific vendors who are allowed to participate in a tender.

**Features:**

- Buyer selects vendors from enlisted and approved vendor list
- System generates unique invitation tokens per vendor
- Only invited vendors can view and bid on the tender
- Invitation status tracking (sent, viewed, bid_started, submitted, declined)
- Access control middleware enforces participation restrictions

**Applicable to all tender modes:** Simple RFQ, Detailed RFT, and Live Tendering

3\. User Roles & Permissions

Access control is enforced via Role-Based Access Control (RBAC). The following table summarises every role and its capabilities. A single user account may carry multiple roles (e.g., an admin who is also a buyer).

|                   |                                                                                                                                       |                                             |
|-------------------|---------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------|
| **Role**          | **Key Responsibilities**                                                                                                              | **Can Access Bid Prices Before Opening?**   |
| Buyer (Purchaser) | Create & manage tenders. Define specs, features, BoM. Invite vendors. Publish addenda. Evaluate & award bids. Export results.         | No --- only after Bid Opening Date.         |
| Vendor (Bidder)   | Maintain company profile & capability catalog. View eligible tenders. Submit, withdraw, and resubmit bids. Respond to clarifications. | Can see only own bid values.                |
| Evaluator         | Score technical parameters. Mark compliance. Add evaluation remarks. Unlock commercial envelopes (if authorised). Cannot modify bids. | Only after commercial envelope is unlocked. |
| Tenant Admin      | Manage users & roles within an organisation. Configure master data (Categories, UOMs, Incoterms). View organisation-level audit logs. | No.                                         |
| Platform Admin    | Full system access. Cross-tenant user management. System-wide audit logs. Infrastructure configuration.                               | Yes --- for audit purposes only.            |

3.1 Permission Matrix --- Tender Object

|                      |                   |                   |            |               |           |
|----------------------|-------------------|-------------------|------------|---------------|-----------|
| **Action**           | **Buyer (Owner)** | **Buyer (Other)** | **Vendor** | **Evaluator** | **Admin** |
| Create Tender        | ✓                 | ✗                 | ✗          | ✗             | ✓         |
| Edit Draft Tender    | ✓                 | ✗                 | ✗          | ✗             | ✓         |
| Publish Tender       | ✓                 | ✗                 | ✗          | ✗             | ✓         |
| View Tender Details  | ✓                 | ✓                 | ✓\*        | ✓             | ✓         |
| Submit Bid           | ✗                 | ✗                 | ✓\*        | ✗             | ✗         |
| View All Bids        | ✓ (post-open)     | ✗                 | ✗          | ✓ (post-open) | ✓         |
| Score / Evaluate Bid | ✗                 | ✗                 | ✗          | ✓             | ✗         |
| Award Tender         | ✓                 | ✗                 | ✗          | ✗             | ✓         |
| Cancel Tender        | ✓                 | ✗                 | ✗          | ✗             | ✓         |

\* Vendors can view a tender only if it is Open, or if they hold an active invitation for a Limited tender.

4\. Tender / RFQ Core Data Model

4.1 Tender Header --- Column Definitions

|                      |               |              |                    |                                                                                |
|----------------------|---------------|--------------|--------------------|--------------------------------------------------------------------------------|
| **Column**           | **Type**      | **Nullable** | **Default**        | **Validation / Notes**                                                         |
| id                   | UUID          | No           | uuid_generate_v4() | Primary key.                                                                   |
| tender_number        | TEXT          | No           | ---                | User-facing reference (e.g., RFQ-2024-001). UNIQUE per buyer_org.              |
| buyer_org_id         | UUID → orgs   | No           | ---                | FK to organisations. Must be type = \'buyer\'.                                 |
| title                | TEXT          | No           | ---                | Max 255 characters.                                                            |
| tender_type          | ENUM          | No           | ---                | Values: RFQ \| TENDER. Drives workflow differences.                            |
| tender_mode          | ENUM          | No           | detailed_rft       | Values: simple_rfq \| detailed_rft \| live_auction. live_auction is set when the buyer enables live tendering at creation (for either bunch). See §2.5.     |
| is_govt_tender       | BOOLEAN       | No           | true               | TRUE = government tender (Detailed RFT), FALSE = non-government (Simple RFQ).   |
| visibility           | ENUM          | No           | ---                | Values: open \| limited.                                                       |
| procurement_type     | ENUM          | No           | ---                | Values: goods \| works \| services.                                            |
| currency             | CHAR(3)       | No           | ---                | ISO 4217. FK to currency_master.                                               |
| price_basis          | ENUM          | No           | unit_rate          | Values: unit_rate \| lump_sum. Determines how line-item totals are calculated. |
| fund_allocation      | NUMERIC(18,2) | Yes          | NULL               | Buyer\'s budget ceiling. Hidden from vendors. Used in evaluation.              |
| bid_security_amount  | NUMERIC(18,2) | Yes          | NULL               | EMD amount required. NULL = no EMD required.                                   |
| pre_bid_meeting_date | TIMESTAMPTZ   | Yes          | NULL               | If set, a notification is triggered 48 h before.                               |
| pre_bid_meeting_link | TEXT          | Yes          | NULL               | Virtual meeting URL. Visible only to invited / eligible vendors.               |
| submission_deadline  | TIMESTAMPTZ   | No           | ---                | Must be \> now() at creation. Cannot be moved backward.                        |
| bid_opening_time     | TIMESTAMPTZ   | Yes          | NULL               | NULL = manual open. Otherwise auto-open at this time.                          |
| validity_days        | INTEGER       | No           | 90                 | Offer validity in days from submission_deadline.                               |
| extended_data        | JSONB         | No           | \'{}\'              | Mode-specific fields stored as JSON. See §2.5 for structure per mode.          |
| live_bidding_start   | TIMESTAMPTZ   | Yes          | NULL               | Scheduled start time for live auction. NULL for non-live tenders.              |
| live_bidding_end     | TIMESTAMPTZ   | Yes          | NULL               | Scheduled end time for live auction. NULL for non-live tenders.                |
| live_bidding_duration_minutes | INTEGER | Yes | NULL | Duration in minutes for live auction. NULL for non-live tenders.              |
| api_version          | VARCHAR(10)   | No           | v2                 | API version for this tender. Used for backward compatibility.                  |
| status               | TEXT → master | No           | draft              | See §4.2 State Machine.                                                        |
| created_by           | UUID → users  | No           | ---                | The user who created the tender.                                               |
| created_at           | TIMESTAMPTZ   | No           | now()              | Immutable after insert.                                                        |
| updated_at           | TIMESTAMPTZ   | No           | now()              | Auto-update on any row change.                                                 |

4.2 Tender Status State Machine

The following transitions are the only legal moves. Any attempt to transition outside these rules returns HTTP 409 Conflict.

**Standard Tender Statuses (Simple RFQ & Detailed RFT):**

|                 |                                      |                                                                   |
|-----------------|--------------------------------------|-------------------------------------------------------------------|
| **From Status** | **Allowed Next Statuses**            | **Trigger**                                                       |
| draft           | published \| cancelled               | Buyer publishes or discards.                                      |
| published       | clarification \| closed \| cancelled | Vendor posts a question; deadline passes; buyer cancels.          |
| clarification   | published \| closed \| cancelled     | Buyer answers and re-opens; deadline passes; buyer cancels.       |
| closed          | tech_eval                            | Bid opening occurs (auto or manual).                              |
| tech_eval       | comm_eval \| cancelled               | All bids technically scored; buyer unlocks commercial. Or cancel. |
| comm_eval       | awarded \| cancelled                 | Buyer awards or cancels.                                          |
| awarded         | --- (terminal)                       | No further transitions.                                           |
| cancelled       | --- (terminal)                       | No further transitions.                                           |

**Live Tendering Statuses (Live Auction Mode):**

|                 |                                      |                                                                   |
|-----------------|--------------------------------------|-------------------------------------------------------------------|
| **From Status** | **Allowed Next Statuses**            | **Trigger**                                                       |
| draft           | scheduled \| cancelled               | Buyer schedules live auction or discards.                              |
| scheduled       | active \| cancelled                 | Scheduled start time reached; buyer cancels.                           |
| active          | paused \| completed \| cancelled     | Buyer pauses auction; scheduled end time reached; buyer cancels.       |
| paused          | active \| cancelled                 | Buyer resumes auction; buyer cancels.                                  |
| completed       | tech_eval \| cancelled             | Auction ended; buyer cancels.                                        |
| tech_eval       | comm_eval \| cancelled             | All bids technically scored; buyer unlocks commercial. Or cancel.       |
| comm_eval       | awarded \| cancelled               | Buyer awards or cancels.                                          |
| awarded         | --- (terminal)                       | No further transitions.                                           |
| cancelled       | --- (terminal)                       | No further transitions.                                           |

**Note:** Live auction status transitions are managed automatically by the background service based on scheduled_start and scheduled_end times. Manual overrides are allowed for pausing/resuming.

4.3 Tender Terms (1:1 sub-table)

|                |                 |                                                                     |
|----------------|-----------------|---------------------------------------------------------------------|
| **Column**     | **Type**        | **Notes**                                                           |
| tender_id      | UUID → tenders  | PK & FK. Cascade delete.                                            |
| payment_terms  | TEXT            | Free text or selected from a template library.                      |
| delivery_terms | TEXT (Incoterm) | EXW \| FCA \| FAS \| FOB \| CFR \| CIF \| CIP \| DAP \| DAT \| DDP. |

4.4 live_bidding_sessions --- Live Auction Management

This table manages live auction sessions for tenders with tender_mode = 'live_auction'.

|                       |               |              |                    |                                                                                |
|-----------------------|---------------|--------------|--------------------|--------------------------------------------------------------------------------|
| **Column**            | **Type**      | **Nullable** | **Default**        | **Validation / Notes**                                                         |
| id                    | UUID          | No           | uuid_generate_v4() | Primary key.                                                                   |
| tender_id             | UUID → tenders | No           | ---                | FK. UNIQUE constraint ensures one session per tender. Cascade delete.              |
| scheduled_start       | TIMESTAMPTZ   | No           | ---                | When the live auction is scheduled to begin.                                  |
| scheduled_end         | TIMESTAMPTZ   | No           | ---                | When the live auction is scheduled to end.                                    |
| actual_start          | TIMESTAMPTZ   | Yes          | NULL               | Set when auction actually starts. NULL until start.                              |
| actual_end            | TIMESTAMPTZ   | Yes          | NULL               | Set when auction actually ends. NULL until completion.                             |
| status               | ENUM          | No           | scheduled          | Values: scheduled \| active \| paused \| completed \| cancelled.                  |
| bidding_type         | ENUM          | No           | ---                | Values: sealed \| open_reverse \| open_auction. See §2.5.3.                 |
| current_best_bid_id  | UUID → bids   | Yes          | NULL               | FK to bids table. The current winning bid. NULL if no bids yet.              |
| total_bids_submitted | INTEGER      | No           | 0                  | Counter for total bids in this session.                                          |
| settings             | JSONB         | No           | \'{}\'              | Auction-specific settings: min_increment, visibility_rules, etc.                     |
| created_at           | TIMESTAMPTZ   | No           | now()              | Auto.                                                                        |
| updated_at           | TIMESTAMPTZ   | No           | now()              | Auto-update on any row change.                                                 |

**Business Rules:**
- Session status transitions automatically: scheduled → active (at scheduled_start), active → completed (at scheduled_end).
- Background service polls every 10 seconds to enforce timing.
- For open_reverse auctions, bids must be lower than current_best_bid by min_increment.
- For open_auction, bids must be higher than current_best_bid by min_increment.
- Sealed auctions hide all bids until status = completed.

4.5 limited_tender_vendors --- Vendor Pre-Selection

This table manages vendor invitations for tenders with visibility = 'limited'.

|                  |                |              |                                                                                                 |
|------------------|----------------|--------------|-------------------------------------------------------------------------------------------------|
| **Column**       | **Type**       | **Nullable** | **Notes**                                                                                       |
| tender_id        | UUID → tenders | No           | Composite PK part 1. FK. Cascade delete.                                                          |
| vendor_org_id    | UUID → orgs    | No           | Composite PK part 2. FK.                                                                       |
| invited_at       | TIMESTAMPTZ    | No           | now()              | When the invitation was created.                                                                |
| invitation_status | ENUM           | No           | sent               | Values: sent \| accepted \| declined. See state machine below.                                  |

**Invitation Status State Machine**

|             |                         |                                                  |
|-------------|-------------------------|--------------------------------------------------|
| **From**    | **To**                  | **Trigger**                                      |
| sent        | accepted \| declined      | Vendor accepts invitation / vendor explicitly declines. |
| accepted    | --- (terminal)          | Vendor can now view and bid on the tender.            |
| declined    | --- (terminal)          | No further action from this vendor.              |

**Business Rules:**
- Only vendors in this table can view and bid on limited tenders.
- Access control middleware enforces this restriction at API level.
- Invitation status is independent of bid submission status.

4.6 live_bid_updates --- Real-Time Bid Event Log

This table logs all bid events during live auctions for audit and real-time updates.

|               |                            |              |                                                              |
|---------------|----------------------------|--------------|--------------------------------------------------------------|
| **Column**    | **Type**                   | **Notes**                                            |
| id            | UUID                       | PK.                                                  |
| session_id    | UUID → live_bidding_sessions | FK. Cascade delete.                                  |
| bid_id        | UUID → bids                | FK. The bid that triggered this event.                 |
| vendor_org_id | UUID → orgs               | FK. The vendor who submitted the bid.                   |
| event_type    | ENUM                       | Values: new_bid \| bid_withdrawn \| bid_improved \| outbid. |
| event_data    | JSONB                      | Additional event context: {old_price, new_price, timestamp}.   |
| created_at    | TIMESTAMPTZ                | Auto.                                                 |

**Business Rules:**
- Every bid submission creates a new_bid event.
- If a bid improves the current best, a bid_improved event is logged.
- If a vendor is outbid, an outbid event is logged for that vendor.
- These events are published via Redis pub/sub for real-time SSE updates.

5\. Line Items & Bill of Materials (BoM)

5.1 tender_items --- Hierarchical Structure

Items form a tree via parent_item_id. A row where item_type = \'group\' is a logical container (its quantity is informational only). Leaf rows (item_type = \'item\') carry the quantity that vendors must price. The sl_no uniqueness is scoped to (tender_id, parent_item_id) to allow independent numbering per group.

**Hierarchy Constraints:**
- Maximum nesting depth: 5 levels (root = level 1)
- Maximum items per tender: 2,000 (configurable per tenant)
- Maximum items per group: 500
- Circular reference prevention enforced at database level via trigger

|                |                   |              |                                                              |
|----------------|-------------------|--------------|--------------------------------------------------------------|
| **Column**     | **Type**          | **Nullable** | **Notes**                                                    |
| id             | UUID              | No           | PK.                                                          |
| tender_id      | UUID → tenders    | No           | FK. Cascade delete.                                          |
| parent_item_id | UUID → self       | Yes          | NULL = root item. Non-null = child of another item.          |
| item_type      | ENUM              | No           | group \| item. Groups cannot be priced by vendors.           |
| sl_no          | INTEGER           | No           | Display sequence. UNIQUE per (tender_id, parent_item_id).    |
| item_code      | TEXT              | Yes          | Buyer\'s internal SKU. Not visible to vendors if configured. |
| item_name      | TEXT              | No           | Short label. Max 200 chars.                                  |
| specification  | TEXT              | Yes          | Rich-text spec. Supports markdown or stored HTML.            |
| quantity       | NUMERIC(14,3)     | No           | 0 for group rows. Must be \> 0 for item rows.                |
| uom            | TEXT → uom_master | No           | FK to unit-of-measure master.                                |
| estimated_cost | NUMERIC(18,2)     | Yes          | Buyer\'s hidden budget per unit. Never exposed to vendors.   |
| created_at     | TIMESTAMPTZ       | No           | Auto.                                                        |

5.2 Feature & Selection Engine

Buyers attach structured feature groups to each line item. Vendors must respond to every mandatory feature. This replaces unstructured free-text bids with machine-comparable data.

**feature_definitions --- Master catalogue of reusable features**

|                   |              |                                                                                           |
|-------------------|--------------|-------------------------------------------------------------------------------------------|
| **Column**        | **Type**     | **Notes**                                                                                 |
| id                | UUID         | PK.                                                                                       |
| name              | TEXT         | e.g., \'Processor\', \'Warranty Period\'. Max 100 chars.                                  |
| feature_type      | ENUM         | single_select \| multi_select \| text \| numeric \| boolean.                              |
| scoring_type      | ENUM         | binary (compliant/not) \| graded (score per option) \| numeric (evaluator assigns score). |
| evaluation_weight | NUMERIC(5,2) | Weight in technical scoring (0.00--100.00). Sum across features per item should = 100.    |
| is_global         | BOOLEAN      | If TRUE, this feature can be reused across tenders without re-creation.                   |

**feature_options --- Selectable values for a feature**

|              |                            |                                                           |
|--------------|----------------------------|-----------------------------------------------------------|
| **Column**   | **Type**                   | **Notes**                                                 |
| id           | UUID                       | PK.                                                       |
| feature_id   | UUID → feature_definitions | FK. Cascade delete.                                       |
| option_value | TEXT                       | Display label, e.g., \'Intel i7\'. Max 150 chars.         |
| option_score | NUMERIC(5,2)               | Pre-assigned score for graded scoring_type. 0 for binary. |
| sort_order   | INTEGER                    | Display order within the feature.                         |

**tender_item_features --- Attaches features to a specific line item**

|                |                            |                                                     |
|----------------|----------------------------|-----------------------------------------------------|
| **Column**     | **Type**                   | **Notes**                                           |
| tender_item_id | UUID → tender_items        | Composite PK part 1.                                |
| feature_id     | UUID → feature_definitions | Composite PK part 2.                                |
| is_mandatory   | BOOLEAN                    | TRUE = vendor must respond. FALSE = optional bonus. |

6\. Vendor Bid Submission & Versioning

Bids are encrypted at rest (AES-256). No one --- including Platform Admin --- can read bid content until the bid_opening_time has passed or the buyer manually opens bids. Versioning allows vendors to withdraw and resubmit without losing history.

6.1 bids --- Bid Header

|                   |                |              |                                                                                                 |
|-------------------|----------------|--------------|-------------------------------------------------------------------------------------------------|
| **Column**        | **Type**       | **Nullable** | **Notes**                                                                                       |
| id                | UUID           | No           | PK.                                                                                             |
| tender_id         | UUID → tenders | No           | FK.                                                                                             |
| vendor_org_id     | UUID → orgs    | No           | FK. The vendor organisation.                                                                    |
| version           | INTEGER        | No           | Starts at 1. Incremented on each resubmission. UNIQUE per (tender_id, vendor_org_id, version).  |
| status            | ENUM           | No           | draft \| submitted \| withdrawn. See §6.3.                                                      |
| total_amount      | NUMERIC(18,2)  | Yes          | Auto-calculated sum of all bid_items totals + taxes. Stored for fast comparison.                |
| compliance_status | ENUM           | Yes          | compliant \| non_compliant \| partial. Derived after evaluation but stored for quick filtering. |
| digital_hash      | TEXT           | Yes          | SHA-256 of the bid payload at submission time. Used for integrity verification.                 |
| submitted_at      | TIMESTAMPTZ    | Yes          | Exact timestamp of submission. NULL while in draft.                                             |
| created_at        | TIMESTAMPTZ    | No           | Row creation time.                                                                              |
| updated_at        | TIMESTAMPTZ    | No           | Auto-update.                                                                                    |

6.2 bid_envelopes --- Technical / Commercial Separation

Each bid is split into envelopes. The technical envelope is opened first; the commercial envelope remains sealed until the evaluator (or system) explicitly unlocks it for technically qualified bids only.

|               |              |                                                     |
|---------------|--------------|-----------------------------------------------------|
| **Column**    | **Type**     | **Notes**                                           |
| id            | UUID         | PK.                                                 |
| bid_id        | UUID → bids  | FK.                                                 |
| envelope_type | ENUM         | technical \| commercial. One row per type per bid.  |
| is_open       | BOOLEAN      | FALSE until explicitly opened.                      |
| opened_at     | TIMESTAMPTZ  | Nullable. Set when is_open flips to TRUE.           |
| opened_by     | UUID → users | Nullable. The user who opened it (for manual open). |

6.3 Bid Versioning State Machine

|                 |                                 |                                                                  |
|-----------------|---------------------------------|------------------------------------------------------------------|
| **From Status** | **Allowed Next**                | **Trigger / Rule**                                               |
| draft           | submitted \| withdrawn          | Vendor finalises and submits before deadline, or discards draft. |
| submitted       | withdrawn                       | Vendor withdraws before submission_deadline. Creates no new row. |
| withdrawn       | --- (terminal for this version) | A new version row is created when the vendor submits again.      |

Active bid resolution: SELECT \* FROM bids WHERE tender_id = X AND vendor_org_id = Y AND status = \'submitted\' ORDER BY version DESC LIMIT 1. If no row exists, the vendor has no active bid.

6.4 bid_items --- Per-Line-Item Vendor Response

|                        |                     |              |                                                                          |
|------------------------|---------------------|--------------|--------------------------------------------------------------------------|
| **Column**             | **Type**            | **Nullable** | **Notes**                                                                |
| id                     | UUID                | No           | PK.                                                                      |
| bid_id                 | UUID → bids         | No           | FK.                                                                      |
| tender_item_id         | UUID → tender_items | No           | FK. Must exist in the referenced tender.                                 |
| envelope_type          | ENUM                | No           | technical \| commercial. Determines which envelope this data belongs to. |
| unit_price             | NUMERIC(18,4)       | Yes          | Vendor\'s unit price. NULL in the technical envelope.                    |
| item_total_price       | NUMERIC(18,2)       | Yes          | Cached: quantity × unit_price. Recalculated on read if NULL.             |
| compliance             | ENUM                | Yes          | compliant \| non_compliant \| partial.                                   |
| non_compliance_remarks | TEXT                | Yes          | Mandatory if compliance ≠ compliant.                                     |
| brand_make             | TEXT                | Yes          | Vendor\'s brand / make for this item.                                    |

6.5 bid_item_feature_values --- Vendor Feature Selections

|               |                            |                                                                |
|---------------|----------------------------|----------------------------------------------------------------|
| **Column**    | **Type**                   | **Notes**                                                      |
| bid_item_id   | UUID → bid_items           | Composite PK part 1.                                           |
| feature_id    | UUID → feature_definitions | Composite PK part 2.                                           |
| option_id     | UUID → feature_options     | Set for single_select / multi_select. NULL for text / numeric. |
| text_value    | TEXT                       | Set for feature_type = text. NULL otherwise.                   |
| numeric_value | NUMERIC(12,3)              | Set for feature_type = numeric. NULL otherwise.                |

Validation rule: For every mandatory feature attached to a tender_item, the vendor MUST have a corresponding row in bid_item_feature_values. Submission is rejected otherwise.

7\. Tender Visibility & Invitation Lifecycle

7.1 Open Tender

- Visible to all registered and approved vendors.

- Any vendor passing the tender\'s qualification requirements (§8) may submit a bid.

- No invitation token is needed.

7.2 Limited Tender --- Invitation System

The buyer selects vendors from the enlisted & approved vendor list. The system generates a unique, cryptographically random invitation token per vendor. The token is embedded in the notification link.

**tender_vendor_invitations**

|                  |                |              |                                                                                                 |
|------------------|----------------|--------------|-------------------------------------------------------------------------------------------------|
| **Column**       | **Type**       | **Nullable** | **Notes**                                                                                       |
| tender_id        | UUID → tenders | No           | Composite PK part 1.                                                                            |
| vendor_org_id    | UUID → orgs    | No           | Composite PK part 2.                                                                            |
| invitation_token | TEXT           | No           | Cryptographically random (min 32 bytes, hex-encoded). Single-use for first access verification. |
| status           | ENUM           | No           | sent \| viewed \| bid_started \| submitted \| declined. See state machine below.                |
| invited_at       | TIMESTAMPTZ    | No           | When the invitation was created.                                                                |
| viewed_at        | TIMESTAMPTZ    | Yes          | First time the vendor opened the tender via the token link.                                     |
| declined_at      | TIMESTAMPTZ    | Yes          | If vendor explicitly declines.                                                                  |
| declined_reason  | TEXT           | Yes          | Optional free-text reason for declining.                                                        |

**Invitation Status State Machine**

|             |                         |                                                  |
|-------------|-------------------------|--------------------------------------------------|
| **From**    | **To**                  | **Trigger**                                      |
| sent        | viewed \| declined      | Vendor clicks link / vendor explicitly declines. |
| viewed      | bid_started \| declined | Vendor begins drafting a bid / declines.         |
| bid_started | submitted \| declined   | Vendor submits bid / declines before deadline.   |
| submitted   | --- (terminal)          | Bid is in the system.                            |
| declined    | --- (terminal)          | No further action from this vendor.              |

8\. Vendor Enlistment & Approval Workflow

Vendors must complete enlistment before they can participate in any tender. The buyer organisation controls approval. Document expiry is tracked and alerts are sent automatically.

8.1 vendor_profiles

|                   |              |              |                                                     |
|-------------------|--------------|--------------|-----------------------------------------------------|
| **Column**        | **Type**     | **Nullable** | **Notes**                                           |
| organization_id   | UUID → orgs  | No           | PK. 1:1 with organisations where type = \'vendor\'. |
| legal_name        | TEXT         | No           | Full legal entity name.                             |
| tax_id            | TEXT         | Yes          | VAT / GST / TIN number.                             |
| contact_name      | TEXT         | Yes          | Primary point of contact.                           |
| contact_email     | TEXT         | Yes          | Primary contact email.                              |
| contact_phone     | TEXT         | Yes          | Primary phone.                                      |
| website           | TEXT         | Yes          | Company website URL.                                |
| status            | ENUM         | No           | pending \| approved \| rejected \| suspended.       |
| status_changed_at | TIMESTAMPTZ  | No           | When status last changed.                           |
| status_changed_by | UUID → users | Yes          | The buyer/admin who changed status.                 |
| rejection_reason  | TEXT         | Yes          | Mandatory if status = rejected.                     |
| created_at        | TIMESTAMPTZ  | No           | Auto.                                               |

8.2 vendor_categories --- Capability Mapping

|               |                          |                                                  |
|---------------|--------------------------|--------------------------------------------------|
| **Column**    | **Type**                 | **Notes**                                        |
| vendor_org_id | UUID → orgs              | Composite PK part 1.                             |
| category_id   | UUID → categories_master | Composite PK part 2. Links to tender categories. |
| added_at      | TIMESTAMPTZ              | Auto.                                            |

8.3 vendor_documents --- Compliance Documents

|               |              |              |                                                                |
|---------------|--------------|--------------|----------------------------------------------------------------|
| **Column**    | **Type**     | **Nullable** | **Notes**                                                      |
| id            | UUID         | No           | PK.                                                            |
| vendor_org_id | UUID → orgs  | No           | FK.                                                            |
| document_type | ENUM         | No           | trade_license \| vat_certificate \| iso_cert \| other.         |
| file_url      | TEXT         | No           | Object storage path (S3 / MinIO).                              |
| issued_date   | DATE         | Yes          | Date the document was issued.                                  |
| expiry_date   | DATE         | Yes          | Date the document expires. Triggers alerts 30 / 7 days before. |
| uploaded_at   | TIMESTAMPTZ  | No           | Auto.                                                          |
| uploaded_by   | UUID → users | No           | The user who uploaded.                                         |

8.4 Enlistment Status State Machine

|           |                      |                                              |
|-----------|----------------------|----------------------------------------------|
| **From**  | **Allowed Next**     | **Trigger**                                  |
| pending   | approved \| rejected | Buyer reviews and approves or rejects.       |
| approved  | suspended            | Buyer suspends (temporary ban).              |
| rejected  | pending              | Vendor re-applies after addressing concerns. |
| suspended | approved \| rejected | Buyer lifts suspension or formally rejects.  |

9\. Clarifications & Addenda

9.1 clarification_questions

Vendors can post questions against a published tender. Visibility is configurable: either only the buyer sees the question, or all invited/eligible vendors see it (to promote transparency).

|               |                |              |                                                      |
|---------------|----------------|--------------|------------------------------------------------------|
| **Column**    | **Type**       | **Nullable** | **Notes**                                            |
| id            | UUID           | No           | PK.                                                  |
| tender_id     | UUID → tenders | No           | FK.                                                  |
| vendor_org_id | UUID → orgs    | No           | The vendor who asked.                                |
| question_text | TEXT           | No           | The question. Max 2000 chars.                        |
| is_public     | BOOLEAN        | No           | TRUE = all vendors see Q&A. FALSE = only buyer sees. |
| status        | ENUM           | No           | open \| answered \| closed.                          |
| created_at    | TIMESTAMPTZ    | No           | Auto.                                                |

9.2 clarification_answers

|                  |                  |                                                         |
|------------------|------------------|---------------------------------------------------------|
| **Column**       | **Type**         | **Notes**                                               |
| id               | UUID             | PK.                                                     |
| question_id      | UUID → questions | FK. One answer per question.                            |
| buyer_user_id    | UUID → users     | The buyer user who answered.                            |
| answer_text      | TEXT             | Official answer. Max 5000 chars.                        |
| creates_addendum | BOOLEAN          | If TRUE, the buyer must also publish a formal Addendum. |
| answered_at      | TIMESTAMPTZ      | Auto.                                                   |

9.3 addenda --- Official Amendments

|                       |                |              |                                                                         |
|-----------------------|----------------|--------------|-------------------------------------------------------------------------|
| **Column**            | **Type**       | **Nullable** | **Notes**                                                               |
| id                    | UUID           | No           | PK.                                                                     |
| tender_id             | UUID → tenders | No           | FK.                                                                     |
| addendum_number       | INTEGER        | No           | Sequential within a tender (1, 2, 3...).                                |
| title                 | TEXT           | No           | Short title of the amendment.                                           |
| description           | TEXT           | No           | Full description of changes.                                            |
| extends_deadline_days | INTEGER        | Yes          | If \> 0, the system auto-extends submission_deadline by this many days. |
| published_at          | TIMESTAMPTZ    | No           | When the addendum went live.                                            |
| published_by          | UUID → users   | No           | Buyer user.                                                             |

9.4 addendum_acknowledgements --- Vendor Acknowledgement

|                 |                |              |                                                    |
|-----------------|----------------|--------------|----------------------------------------------------|
| **Column**      | **Type**       | **Nullable** | **Notes**                                          |
| addendum_id     | UUID → addenda | No           | Composite PK part 1.                               |
| vendor_org_id   | UUID → orgs    | No           | Composite PK part 2.                               |
| acknowledged_at | TIMESTAMPTZ    | Yes          | NULL = not yet acknowledged. Set on vendor action. |
| acknowledged_by | UUID → users   | Yes          | The vendor-side user who clicked \'Acknowledge\'.  |

Business rule: A vendor cannot submit a bid if any addendum on that tender remains unacknowledged by their organisation.

10\. Evaluation & Comparison Module

10.1 Two-Stage Evaluation Workflow

**Evaluation by Tender Mode:**

**Simple RFQ Mode:**
- Single-stage evaluation focused on price comparison
- No technical envelope separation
- System ranks bids by total price (L1 basis)
- Buyer reviews vendor quotes and selects the lowest bidder
- Platform provides price comparison matrix for buyer decision support
- Buyer makes final award decision

**Detailed RFT Mode:**
- Two-stage evaluation (Technical first, then Commercial)
- Stage 1 --- Technical: Commercial envelopes remain sealed. Evaluators score each bid\'s features and compliance per line item. Output: a list of technically qualified bids (those meeting a configurable minimum technical score).
- Stage 2 --- Commercial: The buyer or authorised evaluator unlocks the commercial envelope for every technically qualified bid. Prices become visible. The system ranks bids by total price (L1 basis) or evaluator-weighted scoring.
- Full audit trail for compliance with Bangladesh Public Procurement Rules 2025

**Live Tendering Mode:**
- Real-time auction determines winner during bidding session
- For sealed auctions: winner determined when auction ends and bids are revealed
- For open reverse auctions: current lowest bid is displayed in real-time; winner is the lowest bidder at auction end
- For open auctions: current highest bid is displayed in real-time; winner is the highest bidder at auction end
- Post-auction evaluation may apply for technical compliance (if applicable)
- Buyer confirms award based on auction results

**General Evaluation Rules:**
- Stage 1 --- Technical: Commercial envelopes remain sealed. Evaluators score each bid\'s features and compliance per line item. Output: a list of technically qualified bids (those meeting a configurable minimum technical score).
- Stage 2 --- Commercial: The buyer or authorised evaluator unlocks the commercial envelope for every technically qualified bid. Prices become visible. The system ranks bids by total price (L1 basis) or evaluator-weighted scoring.

10.2 evaluations --- Scoring Table

|                          |              |              |                                                                                          |
|--------------------------|--------------|--------------|------------------------------------------------------------------------------------------|
| **Column**               | **Type**     | **Nullable** | **Notes**                                                                                |
| id                       | UUID         | No           | PK.                                                                                      |
| bid_id                   | UUID → bids  | No           | FK.                                                                                      |
| evaluator_id             | UUID → users | No           | FK. The evaluator.                                                                       |
| technical_score          | NUMERIC(6,2) | Yes          | Weighted sum of feature scores. Range 0--100.                                            |
| commercial_score         | NUMERIC(6,2) | Yes          | Price-based score. Calculated by system after commercial unlock.                         |
| overall_score            | NUMERIC(6,2) | Yes          | Final blended score: (tech_weight × technical_score) + (comm_weight × commercial_score). |
| is_technically_qualified | BOOLEAN      | Yes          | TRUE if technical_score ≥ tender\'s min_technical_score threshold.                       |
| remarks                  | TEXT         | Yes          | Free-text evaluation notes.                                                              |
| created_at               | TIMESTAMPTZ  | No           | Auto.                                                                                    |
| updated_at               | TIMESTAMPTZ  | No           | Auto.                                                                                    |

**10.2.1 Multiple Evaluator Score Aggregation**

When multiple evaluators score the same bid, the final scores are aggregated as follows:

|                          |                                                                                          |
|--------------------------|------------------------------------------------------------------------------------------|
| **Aggregation Method**   | **Description**                                                                          |
| Average (Default)        | technical_score_final = AVG(technical_score) across all evaluators                       |
| Weighted Average         | Each evaluator has a weight (e.g., senior = 1.5, junior = 1.0). Configurable per tender. |
| Consensus Required       | All evaluators must be within 10 points of each other, else flagged for review.          |
| Majority Rules           | If 3+ evaluators, outlier scores (>15 points from median) are excluded.                  |

- Tender creator selects aggregation method at tender creation (default: Average).
- Minimum evaluators per bid: configurable (default: 1, recommended: 2 for tenders > $100K).
- Evaluation conflict resolution: if scores diverge by > 20 points, system flags for committee review.

10.3 evaluation_line_scores --- Per-Item Granular Scoring

|                |                     |                                                            |
|----------------|---------------------|------------------------------------------------------------|
| **Column**     | **Type**            | **Notes**                                                  |
| evaluation_id  | UUID → evaluations  | Composite PK part 1.                                       |
| tender_item_id | UUID → tender_items | Composite PK part 2.                                       |
| feature_id     | UUID → feature_defs | Composite PK part 3.                                       |
| score          | NUMERIC(5,2)        | Score assigned by evaluator for this feature on this item. |
| remarks        | TEXT                | Optional per-feature remark.                               |

10.4 Comparison Matrix Logic

- Compliance Matrix: For each (vendor × line_item), display compliant (green) \| partial (yellow) \| non_compliant (red).

- Feature Comparison: Side-by-side table showing each vendor\'s selected option per feature.

- Financial Comparison: Row = line item, Column = vendor. Shows unit_price and item_total_price. Footer row = grand total including taxes.

- Ranking: Bids are ranked by overall_score (descending). Ties broken by total_amount (ascending).

11\. Award Management

Awards can be full (entire tender to one vendor) or partial (different line items to different vendors). This supports split-award procurement common in government and large-scale EPC projects.

11.1 awards

|                  |                     |              |                                                   |
|------------------|---------------------|--------------|---------------------------------------------------|
| **Column**       | **Type**            | **Nullable** | **Notes**                                         |
| id               | UUID                | No           | PK.                                               |
| tender_id        | UUID → tenders      | No           | FK. Denormalized for fast query.                  |
| tender_item_id   | UUID → tender_items | No           | FK. The line item being awarded.                  |
| bid_id           | UUID → bids         | No           | FK. The winning bid for this item.                |
| awarded_quantity | NUMERIC(14,3)       | No           | Quantity awarded. Must be ≤ tender_item quantity. |
| awarded_price    | NUMERIC(18,2)       | No           | Agreed unit price for the award.                  |
| awarded_at       | TIMESTAMPTZ         | No           | Auto.                                             |
| awarded_by       | UUID → users        | No           | Buyer user who issued the award.                  |

- Business rule: Once a tender is awarded, its status moves to \'awarded\'. No further bid submissions or evaluations are permitted.

- Business rule: The sum of awarded_quantity across all awards for a tender_item must not exceed that item\'s original quantity.

12\. Notifications & Deadline Management

12.1 Notification Channels

- Email (primary --- always sent).

- SMS (optional --- enabled per organisation or per tender).

- In-App Toast (real-time push via WebSocket or SSE).

12.2 notifications --- Tracking Table

|                   |                |              |                                                            |
|-------------------|----------------|--------------|------------------------------------------------------------|
| **Column**        | **Type**       | **Nullable** | **Notes**                                                  |
| id                | UUID           | No           | PK.                                                        |
| tender_id         | UUID → tenders | Yes          | Nullable --- some notifications are user-level only.       |
| recipient_id      | UUID → users   | No           | The user who receives this notification.                   |
| notification_type | ENUM           | No           | See §12.3 for full list.                                   |
| channel           | ENUM           | No           | email \| sms \| in_app.                                    |
| status            | ENUM           | No           | pending \| sent \| delivered \| failed \| retried.         |
| payload           | JSONB          | Yes          | Notification-specific data (e.g., tender title, deadline). |
| sent_at           | TIMESTAMPTZ    | Yes          | When the message was dispatched.                           |
| failed_reason     | TEXT           | Yes          | Error detail if status = failed.                           |
| created_at        | TIMESTAMPTZ    | No           | Auto.                                                      |

12.3 Notification Type Catalogue

|                         |                                                        |                                      |
|-------------------------|--------------------------------------------------------|--------------------------------------|
| **Type**                | **Trigger**                                            | **Recipients**                       |
| tender_published        | Tender status → published.                             | All eligible / invited vendors.      |
| invitation_sent         | Invitation row created.                                | The invited vendor.                  |
| addendum_published      | New addendum row inserted.                             | All invited / eligible vendors.      |
| addendum_unacknowledged | 24 h before deadline; addendum still not acknowledged. | Vendor contacts with pending acks.   |
| clarification_answered  | Buyer posts an answer.                                 | The asking vendor (+ all if public). |
| deadline_reminder_3d    | 3 days before submission_deadline.                     | All vendors who haven\'t submitted.  |
| deadline_reminder_1d    | 1 day before submission_deadline.                      | All vendors who haven\'t submitted.  |
| bid_submitted           | Vendor\'s bid status → submitted.                      | The vendor + the buyer.              |
| bid_opening             | Bids opened (auto or manual).                          | Buyer + all evaluators.              |
| tender_awarded          | Award row inserted.                                    | All participating vendors + buyer.   |
| vendor_doc_expiry_30d   | 30 days before a vendor_document expiry_date.          | Vendor contacts + tenant admin.      |
| vendor_doc_expiry_7d    | 7 days before expiry.                                  | Vendor contacts + tenant admin.      |

12.4 Retry Policy

- Email / SMS: Up to 3 retries with exponential back-off (1 min, 5 min, 25 min). After 3 failures, status = failed; an alert is logged.

- In-App: Delivered via real-time channel only. No retry --- the notification remains in the user\'s notification centre until dismissed.

13\. Audit, Security & Data Integrity

13.1 Immutable Audit Log

The audit_logs table is append-only. The application layer must never execute UPDATE or DELETE against it. At the database level, revoke these privileges from the application service account.

|             |              |                                                                                |
|-------------|--------------|--------------------------------------------------------------------------------|
| **Column**  | **Type**     | **Notes**                                                                      |
| id          | UUID         | PK.                                                                            |
| actor_id    | UUID → users | The user who performed the action. NULL for system-generated events.           |
| action      | TEXT         | Categorised action code, e.g., TENDER_CREATED, BID_SUBMITTED, ENVELOPE_OPENED. |
| entity_type | TEXT         | The affected entity: tender \| bid \| vendor \| user \| addendum.              |
| entity_id   | UUID         | The PK of the affected entity.                                                 |
| metadata    | JSONB        | Additional context. E.g., {old_status, new_status} for status changes.         |
| created_at  | TIMESTAMPTZ  | Auto. Immutable.                                                               |

13.2 Encryption

- At Rest: AES-256 encryption applied to all columns in bid_items and bid_item_feature_values that contain pricing or vendor-identifying data. Encryption keys are managed per-tenant and rotated quarterly.

- In Transit: TLS 1.3 enforced on all API endpoints. HSTS header with min-age = 31536000.

13.3 Bid Integrity Verification

- On submission, the backend computes SHA-256(JSON payload of the bid) and stores it in bids.digital_hash.

- During evaluation, the system recomputes the hash and compares it to the stored value. A mismatch flags the bid as TAMPERED and blocks evaluation.

- A \"Bid Integrity Report\" can be exported by the buyer showing hash, computation timestamp, and verification status for every bid.

13.4 Rate Limiting & DDoS Protection

- Bid submission endpoint: Max 5 requests per 10 seconds per vendor_org_id. Excess → HTTP 429.

- Login endpoint: Max 10 attempts per 15 minutes per IP. Excess → 15-minute lockout.

- General API: 200 requests per minute per authenticated user. Configurable per tenant.

14\. Qualification & Eligibility Requirements

Buyers can attach pre-qualification criteria to a tender. Vendors must respond to each requirement during bid submission. Mandatory requirements that are not met disqualify the bid automatically.

14.1 tender_qualification_requirements

|              |                |                                                                                              |
|--------------|----------------|----------------------------------------------------------------------------------------------|
| **Column**   | **Type**       | **Notes**                                                                                    |
| id           | UUID           | PK.                                                                                          |
| tender_id    | UUID → tenders | FK.                                                                                          |
| requirement  | TEXT           | Description of the requirement, e.g., \'Minimum 5 years of experience in similar projects\'. |
| is_mandatory | BOOLEAN        | TRUE = must be compliant to qualify. FALSE = scored but not disqualifying.                   |

14.2 bid_qualification_responses

|                |                     |                                                   |
|----------------|---------------------|---------------------------------------------------|
| **Column**     | **Type**            | **Notes**                                         |
| requirement_id | UUID → requirements | Composite PK part 1.                              |
| bid_id         | UUID → bids         | Composite PK part 2.                              |
| response       | TEXT                | Vendor\'s response / evidence description.        |
| document_id    | UUID → attachments  | Nullable. Supporting document uploaded by vendor. |
| compliant      | BOOLEAN             | Evaluator marks TRUE/FALSE after review.          |

15\. Tax & Multi-Currency Engine

Tenders are denominated in a single currency. Tax is calculated per line item based on configurable tax rules. Multi-currency conversion rates are fetched from an external API daily and cached.

15.1 tax_rules --- Configurable Tax Catalogue

|              |              |                                                                                   |
|--------------|--------------|-----------------------------------------------------------------------------------|
| **Column**   | **Type**     | **Notes**                                                                         |
| id           | UUID         | PK.                                                                               |
| name         | TEXT         | e.g., \'GST 18%\', \'VAT 10%\'.                                                   |
| rate_percent | NUMERIC(6,2) | Tax rate, e.g., 18.00.                                                            |
| applies_to   | ENUM         | goods \| works \| services \| all. Must match tender procurement_type or \'all\'. |
| is_active    | BOOLEAN      | FALSE = no longer applied to new tenders.                                         |
| created_at   | TIMESTAMPTZ  | Auto.                                                                             |

15.2 bid_item_taxes --- Per-Item Tax Breakdown

|             |                  |                                                      |
|-------------|------------------|------------------------------------------------------|
| **Column**  | **Type**         | **Notes**                                            |
| bid_item_id | UUID → bid_items | Composite PK part 1.                                 |
| tax_rule_id | UUID → tax_rules | Composite PK part 2.                                 |
| tax_amount  | NUMERIC(18,2)    | Calculated: item_total_price × (rate_percent / 100). |

15.3 currency_rates --- Daily FX Cache

|                 |               |                                                   |
|-----------------|---------------|---------------------------------------------------|
| **Column**      | **Type**      | **Notes**                                         |
| base_currency   | CHAR(3)       | Always the platform\'s base currency (e.g., USD). |
| target_currency | CHAR(3)       | The target ISO code.                              |
| rate            | NUMERIC(12,6) | 1 unit of base = rate units of target.            |
| fetched_at      | TIMESTAMPTZ   | When this rate was retrieved.                     |

16\. Export & Reporting Engine

Buyers and evaluators can export tender data in structured formats for offline review, archival, or integration with ERP systems.

16.1 Supported Exports

|                       |            |                                                 |                          |
|-----------------------|------------|-------------------------------------------------|--------------------------|
| **Export Type**       | **Format** | **Scope**                                       | **Who Can Export**       |
| Tender Summary        | PDF        | Single tender header + terms.                   | Buyer (owner), Admin.    |
| Bid Comparison Matrix | PDF / XLSX | All bids for a tender --- compliance + pricing. | Buyer, Evaluator, Admin. |
| Bid Integrity Report  | PDF        | Hash verification for all bids.                 | Buyer, Admin.            |
| Award Letter          | PDF        | Per-vendor award detail.                        | Buyer (owner), Admin.    |
| Full Tender Data Dump | XLSX       | All items, features, bids, scores --- raw data. | Admin only.              |

16.2 Implementation Note

- PDF generation is handled asynchronously via the task queue (BullMQ / RabbitMQ). The user receives a download link via notification once the export is ready.

- XLSX exports use a streaming row-writer to handle tenders with thousands of line items without memory issues.

17\. Non-Functional Requirements

17.1 Performance

|                          |              |                                       |
|--------------------------|--------------|---------------------------------------|
| **Metric**               | **Target**   | **Measurement**                       |
| Page Load (P95)          | \< 2 seconds | From navigation start to interactive. |
| Bid Submission ACK       | \< 1 second  | From client POST to 200 response.     |
| Concurrent Users         | 10,000+      | During peak closing-minute window.    |
| DB Query (single tender) | \< 200 ms    | Full tender + items + features read.  |
| Search Latency           | \< 300 ms    | Tender / vendor full-text search.     |

17.2 Availability & Reliability

- SLA: 99.9% uptime (\< 8.77 hours downtime per year).

- Automated daily backups with point-in-time recovery (PITR) up to 7 days.

- Health-check endpoint: GET /health returns 200 if DB + cache + queue are reachable.

17.3 Scalability & Multi-Tenancy

- Row-Level Security (RLS) in PostgreSQL enforces tenant isolation. Each tenant\'s data is invisible to others at the query level.

- Stateless API layer --- sessions stored in Redis. Horizontal scaling via container orchestration (Kubernetes / ECS).

- JSONB indexes on feature columns for sub-millisecond feature-based filtering.

17.4 Security

- Passwords: bcrypt with cost factor ≥ 12.

- API Auth: Short-lived JWT (15 min) + refresh token rotation.

- CORS: Whitelist only the platform\'s frontend origin.

- CSP headers on all responses.

- SQL injection prevention: parameterised queries only --- no string interpolation.

**17.5 Performance Target Recommendations**

The following performance targets are recommended based on industry best practices. Actual targets should be validated against your infrastructure during load testing.

| **Metric**               | **Recommended Target** | **Measurement**                       | **Notes**                                                                 |
|--------------------------|-------------------|---------------------------------------|-----------------------------------------------------------------------------|
| Page Load (P95)          | \< 2 seconds | From navigation start to interactive. | Standard for modern web applications. |
| Bid Submission ACK       | \< 1 second  | From client POST to 200 response.     | Standard for REST APIs. |
| Live Bid Submission ACK  | \< 500ms    | From client POST to 200 response.     | **Ambitious** - requires optimized infrastructure, Redis caching, and efficient database queries. Consider 1-2s target for initial implementation. |
| SSE Message Delivery      | \< 100ms     | From server event to client receipt.     | Requires efficient Redis pub/sub and minimal payload size. |
| Concurrent Users         | 10,000+      | During peak closing-minute window.    | Requires horizontal scaling and load balancing. |
| DB Query (single tender) | \< 200 ms    | Full tender + items + features read.  | Requires proper indexing and query optimization. |
| Search Latency           | \< 300 ms    | Tender / vendor full-text search.     | Requires full-text search indexes. |
| Cache Hit Rate           | \> 80%       | Percentage of requests served from cache. | Requires effective cache warming strategy. |

**Performance Optimization Recommendations:**

1. **Live Bidding Optimization:**
   - Use Redis for current best bid caching
   - Implement optimistic locking for bid submission
   - Batch bid validation using Redis pipelines
   - Use database connection pooling

2. **Caching Strategy:**
   - Cache tender data for 1 hour (TTL)
   - Pre-warm cache for live sessions 5 minutes before start
   - Cache vendor eligibility data for large tenders
   - Implement cache-aside pattern for tender listings

3. **Database Optimization:**
   - Add GIN indexes on JSONB columns for mode-specific fields
   - Use materialized views for complex queries
   - Partition live_bid_updates table by date
   - Optimize query patterns based on actual usage

4. **Real-Time Updates:**
   - Use SSE instead of WebSockets for simpler implementation
   - Implement heartbeat every 30 seconds for connection health
   - Batch multiple events into single SSE message
   - Implement connection recovery logic

18\. Suggested Technology Stack

|                 |                              |                                                                                                    |
|-----------------|------------------------------|----------------------------------------------------------------------------------------------------|
| **Layer**       | **Recommended**              | **Rationale**                                                                                      |
| Frontend        | **SvelteKit + Skeleton UI**  | 50% smaller bundles, no virtual DOM overhead --- critical for form-heavy bid submission workflows. Built-in SSR, reactive stores for complex form state. |
| Frontend (Alt)  | Next.js (React) + Ant Design | Alternative if team has React expertise. SSR for SEO on public tender pages.                       |
| Backend         | Node.js (NestJS) + TypeScript | Modular structure maps cleanly to the domain modules. TypeScript end-to-end.                       |
| Database        | PostgreSQL 16+               | JSONB for features, RLS for multi-tenancy, PITR for recovery.                                      |
| Cache / Session | Redis 7+                     | Session store, rate-limit counters, queue locking.                                                 |
| Search          | PostgreSQL Full-Text + pg_trgm | Built-in full-text search with trigram fuzzy matching. Simpler ops, no additional service.       |
| Search (Scale)  | Meilisearch                  | Near-instant search on tenders and vendors. Add when >100K records.                                |
| Object Storage  | AWS S3 / MinIO               | Attachments, exports, vendor documents. Presigned URLs for direct upload.                          |
| Task Queue      | BullMQ (Redis-backed)        | Async jobs: notifications, PDF export, hash computation.                                           |
| Email           | AWS SES / SendGrid           | Reliable delivery at scale. Webhook for delivery receipts.                                         |
| Monitoring      | Prometheus + Grafana         | Dashboards for latency, error rates, queue depth.                                                  |
| Validation      | Zod                          | Runtime type validation for API inputs. Generates TypeScript types.                                |
| Logging         | Pino                         | High-performance structured JSON logging.                                                          |

**18.1 Why SvelteKit over React for this Platform**

|                    |                 |                 |                                                              |
|--------------------|-----------------|-----------------|--------------------------------------------------------------|
| **Criteria**       | **SvelteKit**   | **React/Next**  | **Impact on RFQ Platform**                                   |
| Bundle Size        | ~60KB gzipped   | ~120KB gzipped  | Faster load on government networks with bandwidth limits.    |
| Form Boilerplate   | 50% less code   | Verbose         | Tender creation has 50+ form fields; Svelte's bind: saves time. |
| State Management   | Built-in stores | Redux/Zustand   | Complex bid state (items, features, envelopes) handled natively. |
| Build Performance  | Faster          | Slower          | Faster CI/CD cycles during development.                      |
| Memory Usage       | ~2.3MB          | ~8.7MB          | Better performance for large BOQ tables (100+ items).        |

**Recommendation**: Use SvelteKit for new projects. Use React only if team has existing React expertise and no capacity to learn Svelte.

19\. API Versioning Strategy

**19.1 Versioning Approach**

The platform supports API versioning to maintain backward compatibility while introducing new features.

| **Version** | **Status** | **Key Features** | **Deprecation Timeline** |
|-------------|-------------|-------------------|------------------------|
| v1 | Legacy | Original tender types (RFQ/TENDER), standard evaluation workflow | No deprecation planned |
| v2 | Current | Tender modes (simple_rfq/detailed_rft/live_auction), live tendering, limited tendering | Active |

**19.2 API Endpoint Routing**

```
/api/v1/tenders/*  → Legacy endpoints (read-only, existing tenders)
/api/v2/tenders/*  → New endpoints with tender mode support
/api/tenders/*      → Alias to v2 (default for new clients)
```

**19.3 Backward Compatibility**

- Existing v1 API clients continue to work for reading tender data
- New v2 endpoints support all tender modes and live bidding
- Response format includes `api_version` field to indicate which version was used
- Migration guide provided for v1 clients to upgrade to v2

**19.4 Version Detection**

- Request header `X-API-Version` can specify preferred version (v1 or v2)
- Default to v2 if header not specified
- v1 requests automatically mapped to v2 responses where compatible

20\. API Endpoint Specification (OpenAPI Summary)

All endpoints follow RESTful conventions. Full OpenAPI 3.0 spec should be generated from code using decorators.

**19.1 Authentication Endpoints**

| Method | Endpoint              | Request Body                          | Response                    | Auth Required |
|--------|-----------------------|---------------------------------------|-----------------------------|---------------|
| POST   | /api/auth/register    | { name, email, password, orgId }      | { id, message }             | No            |
| POST   | /api/auth/login       | { email, password }                   | { accessToken, refreshToken }| No           |
| POST   | /api/auth/refresh     | { refreshToken }                      | { accessToken, refreshToken }| No           |
| POST   | /api/auth/logout      | { refreshToken }                      | { message }                 | Yes           |
| POST   | /api/auth/forgot-password | { email }                         | { message }                 | No            |
| POST   | /api/auth/reset-password  | { token, newPassword }            | { message }                 | No            |

**19.2 Tender Endpoints**

| Method | Endpoint                                  | Description                           | Roles Allowed           |
|--------|-------------------------------------------|---------------------------------------|-------------------------|
| POST   | /api/tenders                              | Create new tender                     | Buyer, Admin            |
| GET    | /api/tenders                              | List tenders (filtered by visibility) | All authenticated       |
| GET    | /api/tenders/:id                          | Get tender details                    | All (access rules apply)|
| PUT    | /api/tenders/:id                          | Update tender (draft only)            | Buyer (owner), Admin    |
| POST   | /api/tenders/:id/publish                  | Publish tender                        | Buyer (owner), Admin    |
| POST   | /api/tenders/:id/cancel                   | Cancel tender                         | Buyer (owner), Admin    |
| POST   | /api/tenders/:id/open-bids                | Open technical envelopes              | Buyer (owner), Admin    |
| POST   | /api/tenders/:id/unlock-commercial        | Unlock commercial envelopes           | Buyer (owner), Admin    |
| GET    | /api/tenders/:id/items                    | Get tender line items (tree)          | All (access rules apply)|
| POST   | /api/tenders/:id/items                    | Add line item                         | Buyer (owner)           |
| PUT    | /api/tenders/:id/items/:itemId            | Update line item                      | Buyer (owner)           |
| DELETE | /api/tenders/:id/items/:itemId            | Delete line item                      | Buyer (owner)           |

**19.3 Bid Endpoints**

| Method | Endpoint                                  | Description                           | Roles Allowed           |
|--------|-------------------------------------------|---------------------------------------|-------------------------|
| POST   | /api/tenders/:id/bids                     | Create new bid (draft)                | Vendor                  |
| GET    | /api/tenders/:id/bids/my                  | Get vendor's own bid                  | Vendor                  |
| PUT    | /api/tenders/:id/bids/:bidId              | Update bid (draft only)               | Vendor (owner)          |
| POST   | /api/tenders/:id/bids/:bidId/submit       | Submit bid                            | Vendor (owner)          |
| POST   | /api/tenders/:id/bids/:bidId/withdraw     | Withdraw bid                          | Vendor (owner)          |
| GET    | /api/tenders/:id/bids                     | List all bids (buyer view)            | Buyer (owner), Evaluator|
| GET    | /api/tenders/:id/comparison               | Get comparison matrix                 | Buyer, Evaluator        |

**19.4 Standard Error Response Format**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ],
    "timestamp": "2026-02-15T10:30:00Z",
    "requestId": "uuid-for-tracing"
  }
}
```

**19.5 Standard Error Codes**

| HTTP Status | Code                    | Description                                      |
|-------------|-------------------------|--------------------------------------------------|
| 400         | VALIDATION_ERROR        | Request body failed validation                   |
| 401         | UNAUTHORIZED            | Missing or invalid authentication                |
| 403         | FORBIDDEN               | User lacks permission for this action            |
| 404         | NOT_FOUND               | Resource does not exist                          |
| 409         | CONFLICT                | State transition not allowed (e.g., status change)|
| 422         | BUSINESS_RULE_VIOLATION | Business rule prevented the action               |
| 429         | RATE_LIMITED            | Too many requests                                |
| 500         | INTERNAL_ERROR          | Unexpected server error                          |

20\. Future Enhancements (Post Phase 1)

|                       |                                                                               |                                                                |
|-----------------------|-------------------------------------------------------------------------------|----------------------------------------------------------------|
| **Feature**           | **Description**                                                               | **Schema Impact**                                              |
| e-Contract Generation | Auto-generate contract PDF from award data. DocuSign integration for signing. | New: contracts table. Integration config table.                |
| ERP Integration       | Sync awarded POs to SAP / Oracle via API.                                     | New: erp_sync_jobs table. Webhook config.                      |
| Spend Analytics       | Dashboard showing spend by category, vendor, time period.                     | Read-only views / materialised views on awards + bids.         |
| AI Anomaly Detection  | Flag bids with pricing outliers or collusion patterns.                        | New: anomaly_flags table. ML model output stored as JSONB.     |
| Vendor Portal Mobile  | Dedicated mobile app for vendors to track invitations and submit bids.        | No schema change --- API layer only.                           |
| Multi-Language Support | Add support for Bengali and other languages for Bangladesh market.        | New: translations table. Localisation service layer.              |
| Advanced Analytics  | Predictive pricing models, vendor performance scoring, market trend analysis.              | New: analytics_events table. ML model integration.              |
| Blockchain Integration | Immutable bid records on blockchain for enhanced auditability.              | New: blockchain_hashes table. Smart contract integration.          |

**Note:** Live Auction / Reverse Bidding is now included in Phase 1 (see §2.5.3 and §4.4).
