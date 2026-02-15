# Comprehensive Manual QA Testing Guide
## RFQ Buddy - Bangladesh e-GP Platform

**Version:** 1.0  
**Last Updated:** February 11, 2026  
**Purpose:** Complete manual testing coverage for all pages, forms, fields, and user roles

---

## Table of Contents
1. [Test Environment Setup](#test-environment-setup)
2. [User Roles & Test Accounts](#user-roles--test-accounts)
3. [Authentication & Registration](#authentication--registration)
4. [Dashboard Testing](#dashboard-testing)
5. [Tender Management](#tender-management)
6. [Live Tendering](#live-tendering)
7. [Bid Management](#bid-management)
8. [Evaluation & Awards](#evaluation--awards)
9. [Vendor Management](#vendor-management)
10. [Profile Management](#profile-management)
11. [Document Management](#document-management)
12. [Notifications & Communications](#notifications--communications)
13. [Admin Functions](#admin-functions)
14. [Role-Based Access Control](#role-based-access-control)
15. [End-to-End Workflow Testing](#end-to-end-workflow-testing)
16. [API Testing](#api-testing)
17. [Scheduled Jobs & Automation Testing](#scheduled-jobs--automation-testing)
18. [Email Notification Testing](#email-notification-testing)
19. [Cross-Cutting Concerns](#cross-cutting-concerns)

---

## Test Environment Setup

### Prerequisites Checklist
- [ ] Backend server running on `http://localhost:3000` (or configured port)
- [ ] Frontend dev server running on `http://localhost:5173`
- [ ] PostgreSQL database accessible and seeded
- [ ] Redis instance running (for caching)
- [ ] Environment variables correctly configured (`.env` files)
- [ ] Database migrations applied
- [ ] Seed data loaded (tender types, tax rules, etc.)

### Browser Testing Matrix
Test on the following browsers:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (if available)
- [ ] Mobile Chrome (responsive testing)
- [ ] Mobile Safari (responsive testing)

### Screen Resolutions to Test
- [ ] Desktop: 1920x1080
- [ ] Laptop: 1366x768
- [ ] Tablet: 768x1024
- [ ] Mobile: 375x667

---

## User Roles & Test Accounts

### Test Account Matrix

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| **Buyer** | buyer@test.com | Test@1234 | Primary buyer account for tender creation |
| **Buyer 2** | buyer2@test.com | Test@1234 | Secondary buyer for multi-user testing |
| **Vendor** | vendor@test.com | Test@1234 | Primary vendor for bid submission |
| **Vendor 2** | vendor2@test.com | Test@1234 | Secondary vendor for competition testing |
| **Vendor 3** | vendor3@test.com | Test@1234 | Third vendor for multi-bid scenarios |
| **Admin** | admin@test.com | Test@1234 | System administrator |
| **Evaluator** | evaluator@test.com | Test@1234 | Technical evaluator (if role exists) |

### Role Permission Matrix

| Feature/Action | Buyer | Vendor | Admin | Evaluator |
|----------------|-------|--------|-------|-----------|
| Register Account | ✅ | ✅ | ❌ | ❌ |
| Login/Logout | ✅ | ✅ | ✅ | ✅ |
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| Create Tender | ✅ | ❌ | ✅ | ❌ |
| Edit Own Tender | ✅ | ❌ | ✅ | ❌ |
| Publish Tender | ✅ | ❌ | ✅ | ❌ |
| View All Tenders | ✅ | ✅ | ✅ | ✅ |
| Create Bid | ❌ | ✅ | ❌ | ❌ |
| Submit Bid | ❌ | ✅ | ❌ | ❌ |
| Withdraw Bid | ❌ | ✅ | ❌ | ❌ |
| View All Bids (Tender) | ✅ | ❌ | ✅ | ✅ |
| Evaluate Bids | ✅ | ❌ | ✅ | ✅ |
| Award Tender | ✅ | ❌ | ✅ | ❌ |
| Manage Vendors | ✅ | ❌ | ✅ | ❌ |
| View Vendor Profile | ✅ | ✅(own) | ✅ | ❌ |
| Ask Questions | ❌ | ✅ | ❌ | ❌ |
| Answer Questions | ✅ | ❌ | ✅ | ❌ |
| Create Addendum | ✅ | ❌ | ✅ | ❌ |
| Acknowledge Addendum | ❌ | ✅ | ❌ | ❌ |
| Admin Functions | ❌ | ❌ | ✅ | ❌ |

---

## Authentication & Registration

### 1. Registration Page (`/register`)

#### Test Case: REG-001 - Buyer Registration
**Priority:** Critical | **User Role:** Anonymous

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1.1 | Navigate to `/register` | Registration form displays | [ ] | |
| 1.2 | Verify all fields present | Name, Email, Password, Confirm Password, Role selector visible | [ ] | |
| 1.3 | Leave all fields empty, click Submit | Form validation errors appear | [ ] | |
| 1.4 | Enter name: "Test Buyer" | No errors | [ ] | |
| 1.5 | Enter email: "newbuyer@test.com" | No errors | [ ] | |
| 1.6 | Enter password: "Test@123" | No errors | [ ] | |
| 1.7 | Enter confirm password: "Test@123" | Passwords match, no errors | [ ] | |
| 1.8 | Select role: "Buyer" | Buyer role selected | [ ] | |
| 1.9 | Click Submit button | Account created, redirected to `/dashboard` | [ ] | |
| 1.10 | Verify user logged in | User name appears in header, navigation visible | [ ] | |
| 1.11 | Logout and verify account | Can login with new credentials | [ ] | |

#### Test Case: REG-002 - Vendor Registration
**Priority:** Critical | **User Role:** Anonymous

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 2.1 | Navigate to `/register` | Registration form displays | [ ] | |
| 2.2 | Enter name: "Test Vendor" | No errors | [ ] | |
| 2.3 | Enter email: "newvendor@test.com" | No errors | [ ] | |
| 2.4 | Enter password: "Vendor@123" | No errors | [ ] | |
| 2.5 | Enter confirm password: "Vendor@123" | Passwords match | [ ] | |
| 2.6 | Select role: "Vendor" | Vendor role selected | [ ] | |
| 2.7 | Click Submit | Account created, redirected to `/dashboard` | [ ] | |
| 2.8 | Verify vendor-specific navigation | No "Create Tender" button, has vendor options | [ ] | |

#### Test Case: REG-003 - Registration Validation
**Priority:** High | **User Role:** Anonymous

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 3.1 | Enter mismatched passwords | "Passwords do not match" error | [ ] | |
| 3.2 | Enter weak password: "123" | Password strength error | [ ] | |
| 3.3 | Enter invalid email: "notanemail" | Email format error | [ ] | |
| 3.4 | Use already registered email | "Email already exists" error | [ ] | |
| 3.5 | Enter name < 2 characters | Name length validation error | [ ] | |
| 3.6 | Try SQL injection in name field: `'; DROP TABLE users; --` | Input sanitized, safe error or rejection | [ ] | |
| 3.7 | Try XSS in name field: `<script>alert('xss')</script>` | Input sanitized, no script execution | [ ] | |

---

### 2. Login Page (`/login`)

#### Test Case: LOGIN-001 - Successful Login
**Priority:** Critical | **User Role:** All

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1.1 | Navigate to `/login` | Login form displays | [ ] | |
| 1.2 | Enter email: "buyer@test.com" | No errors | [ ] | |
| 1.3 | Enter password: "Test@1234" | No errors | [ ] | |
| 1.4 | Click "Sign In" button | Redirected to `/dashboard` | [ ] | |
| 1.5 | Verify authentication | User name in header, authenticated navigation | [ ] | |

#### Test Case: LOGIN-002 - Failed Login Scenarios
**Priority:** High | **User Role:** Anonymous

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 2.1 | Enter invalid email | "Invalid credentials" error | [ ] | |
| 2.2 | Enter wrong password | "Invalid credentials" error | [ ] | |
| 2.3 | Leave email empty | Validation error | [ ] | |
| 2.4 | Leave password empty | Validation error | [ ] | |
| 2.5 | Try login 5 times with wrong password | Rate limiting or account lockout | [ ] | Check if implemented |

#### Test Case: LOGIN-003 - Session Persistence
**Priority:** Medium | **User Role:** All

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 3.1 | Login successfully | Redirected to dashboard | [ ] | |
| 3.2 | Refresh page | Still logged in, dashboard loads | [ ] | |
| 3.3 | Open new tab, navigate to `/dashboard` | Still authenticated | [ ] | |
| 3.4 | Close all tabs, reopen browser | Session persisted or login required (depends on config) | [ ] | |

---

### 3. Logout Functionality

#### Test Case: LOGOUT-001 - Logout Flow
**Priority:** High | **User Role:** All

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1.1 | Login as any user | Dashboard displays | [ ] | |
| 1.2 | Click user menu in header | Dropdown opens with "Logout" option | [ ] | |
| 1.3 | Click "Logout" | Redirected to `/login` | [ ] | |
| 1.4 | Try accessing `/dashboard` directly | Redirected back to `/login` | [ ] | |
| 1.5 | Verify session cleared | Cannot access protected routes | [ ] | |

---

## Dashboard Testing

### 4. Dashboard Page (`/dashboard`)

#### Test Case: DASH-001 - Buyer Dashboard
**Priority:** High | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1.1 | Login as buyer | Dashboard loads | [ ] | |
| 1.2 | Verify welcome message | "Welcome back, [Buyer Name]" | [ ] | |
| 1.3 | Check stats cards | Total Tenders, Active Tenders, Pending Evaluation, Awarded | [ ] | |
| 1.4 | Verify stats accuracy | Numbers match actual data | [ ] | Manual count required |
| 1.5 | Check "Quick Actions" section | "Create New Tender", "Manage Vendors" buttons present | [ ] | |
| 1.6 | Check "Recent Tenders" section | Up to 5 recent tenders displayed | [ ] | |
| 1.7 | Click "Create New Tender" | Redirected to `/tenders/new` | [ ] | |
| 1.8 | Click "Manage Vendors" | Redirected to `/vendors` | [ ] | |
| 1.9 | Click "View all" in Recent Tenders | Redirected to `/tenders` | [ ] | |
| 1.10 | Click a tender in list | Redirected to tender detail page | [ ] | |

#### Test Case: DASH-002 - Vendor Dashboard
**Priority:** High | **User Role:** Vendor

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 2.1 | Login as vendor | Dashboard loads | [ ] | |
| 2.2 | Verify welcome message | "Welcome back, [Vendor Name]" | [ ] | |
| 2.3 | Check stats cards | Total Tenders, Active Tenders, Submitted Bids, Pending Bids | [ ] | |
| 2.4 | Verify vendor-specific actions | "Browse Tenders", "Update Profile" | [ ] | |
| 2.5 | Verify NO buyer actions | "Create Tender" and "Manage Vendors" NOT present | [ ] | |
| 2.6 | Check recent tenders | Shows available tenders for bidding | [ ] | |
| 2.7 | Click "Browse Tenders" | Redirected to `/tenders` | [ ] | |

#### Test Case: DASH-003 - Dashboard Data Refresh
**Priority:** Medium | **User Role:** All

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 3.1 | Note current stats | Record numbers | [ ] | |
| 3.2 | Create a new tender (as buyer) | - | [ ] | |
| 3.3 | Return to dashboard | Stats updated with new tender | [ ] | |
| 3.4 | Submit a bid (as vendor) | - | [ ] | |
| 3.5 | Return to dashboard | Stats updated with new bid | [ ] | |

---

## Tender Management

### 5. Tender List Page (`/tenders`)

#### Test Case: TEND-001 - Tender List Display
**Priority:** High | **User Role:** All

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1.1 | Navigate to `/tenders` | List of tenders displays | [ ] | |
| 1.2 | Verify tender cards | Title, Number, Status, Type, Deadline visible | [ ] | |
| 1.3 | Check "Create Tender" button (Buyer) | Button visible and functional | [ ] | |
| 1.4 | Check "Create Tender" button (Vendor) | Button NOT visible | [ ] | |
| 1.5 | Verify status badges | Correct color coding (Draft=blue, Published=green, etc.) | [ ] | |
| 1.6 | Check deadline warning | "Deadline Soon!" badge for < 3 days | [ ] | |

#### Test Case: TEND-002 - Tender Filtering
**Priority:** High | **User Role:** All

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 2.1 | Enter text in "Search" field | Tenders filtered by title/keyword | [ ] | |
| 2.2 | Select "Status" filter: "Published" | Only published tenders shown | [ ] | |
| 2.3 | Select "Type" filter: "RFQ" | Only RFQ tenders shown | [ ] | |
| 2.4 | Combine multiple filters | All filters applied (AND logic) | [ ] | |
| 2.5 | Click "Clear Filters" | All filters reset, full list shown | [ ] | |
| 2.6 | Test with no results | "No tenders found" message | [ ] | |

#### Test Case: TEND-003 - Tender Pagination
**Priority:** Medium | **User Role:** All

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 3.1 | Create > 20 tenders | - | [ ] | Setup step |
| 3.2 | Navigate to `/tenders` | Pagination controls visible | [ ] | |
| 3.3 | Click "Next" page | Next set of tenders loads | [ ] | |
| 3.4 | Click "Previous" page | Previous set loads | [ ] | |
| 3.5 | Change page size (if available) | Correct number of items displayed | [ ] | |

---

### 6. Create Tender Page (`/tenders/new`)

#### Test Case: CREATE-001 - Basic Tender Creation (Goods)
**Priority:** Critical | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1.1 | Login as buyer | - | [ ] | |
| 1.2 | Navigate to `/tenders/new` | Form displays | [ ] | |
| 1.3 | Verify all form sections | Basic Info, Procurement Type, Special Conditions, Dates, etc. | [ ] | |
| 1.4 | Enter Title: "Supply of Office Equipment" | No errors | [ ] | |
| 1.5 | Select Procurement Type: "Goods" | Cost dropdown enabled, checkboxes appear | [ ] | |
| 1.6 | **Verify page responsiveness** | Page does NOT freeze or become unresponsive | [ ] | CRITICAL FIX |
| 1.7 | Wait for cost ranges to load | Loading indicator shown, then options populate | [ ] | |
| 1.8 | Verify cost range options | 3-4 ranges for Goods visible | [ ] | |
| 1.9 | Select "Up to 8 Lac BDT" | Tender type auto-suggests PG1 | [ ] | |
| 1.10 | Verify tender type dropdown | PG1 selected and editable | [ ] | |
| 1.11 | Select Currency: "BDT" | No errors | [ ] | |
| 1.12 | Select Price Basis: "Unit Rate" | No errors | [ ] | |
| 1.13 | Enter Estimated Cost: "500000" | Validates within range | [ ] | |
| 1.14 | Set Submission Deadline: Future date | Date accepted | [ ] | |
| 1.15 | Set Bid Opening Time: After deadline | Date accepted | [ ] | |
| 1.16 | Enter Validity Days: "90" | No errors | [ ] | |
| 1.17 | Click Submit | Tender created, redirected to tender detail | [ ] | |
| 1.18 | Verify tender saved correctly | All fields match input | [ ] | |

#### Test Case: CREATE-002 - Goods with Special Conditions
**Priority:** High | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 2.1 | Start new tender | Form displays | [ ] | |
| 2.2 | Select Procurement Type: "Goods" | Special checkboxes appear | [ ] | |
| 2.3 | Check "International Bidding" | Tender type changes to PG4 | [ ] | |
| 2.4 | Uncheck, check "Turnkey" | Tender type changes to PG5A | [ ] | |
| 2.5 | Uncheck, check "Emergency" | Tender type changes to PG9A | [ ] | |
| 2.6 | Verify priority | Emergency > Turnkey > International | [ ] | |
| 2.7 | Check multiple flags | Highest priority flag determines type | [ ] | |
| 2.8 | Select cost range after flags | Tender type re-evaluates correctly | [ ] | |

#### Test Case: CREATE-003 - Works Procurement
**Priority:** High | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 3.1 | Start new tender | Form displays | [ ] | |
| 3.2 | Select Procurement Type: "Works" | Checkboxes update (no Intl/Turnkey) | [ ] | |
| 3.3 | Verify special flags | Only Emergency flag visible for Works | [ ] | |
| 3.4 | Select cost ≤ 15 Lac | PW1 suggested | [ ] | |
| 3.5 | Select cost > 5 Crore | PW3 suggested | [ ] | |
| 3.6 | Complete and submit form | Tender created successfully | [ ] | |

#### Test Case: CREATE-004 - Services Procurement
**Priority:** High | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 4.1 | Start new tender | Form displays | [ ] | |
| 4.2 | Select Procurement Type: "Services" | "Outsourcing Personnel" checkbox appears | [ ] | |
| 4.3 | Check "Outsourcing Personnel" | PPS2 suggested | [ ] | |
| 4.4 | Uncheck | Reverts to default service type | [ ] | |
| 4.5 | Check "Emergency" | PPS6 suggested | [ ] | |
| 4.6 | Complete and submit | Tender created | [ ] | |

#### Test Case: CREATE-005 - Form Validation
**Priority:** High | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 5.1 | Try submit with empty title | "Title required" error | [ ] | |
| 5.2 | Enter title < 5 characters | Length validation error | [ ] | |
| 5.3 | Enter title > 255 characters | Length validation error | [ ] | |
| 5.4 | Submit without procurement type | "Procurement type required" error | [ ] | |
| 5.5 | Submit without cost selection | "Select cost range" error | [ ] | |
| 5.6 | Set deadline in past | "Deadline must be in future" error | [ ] | |
| 5.7 | Set opening time before deadline | "Opening must be after deadline" error | [ ] | |
| 5.8 | Enter negative validity days | Validation error | [ ] | |

#### Test Case: CREATE-006 - Form Reset on Procurement Type Change
**Priority:** Medium | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 6.1 | Select "Goods", fill form partially | Data entered | [ ] | |
| 6.2 | Change to "Works" | Cost dropdown resets, checkboxes update | [ ] | |
| 6.3 | Verify tender type cleared | Type field reset for re-selection | [ ] | |
| 6.4 | Change back to "Goods" | Previous Goods data NOT restored | [ ] | |

#### Test Case: CREATE-007 - Two-Envelope System
**Priority:** Medium | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 7.1 | Start tender creation | Form displays | [ ] | |
| 7.2 | Check "Two-Envelope System" checkbox | Checkbox selected | [ ] | |
| 7.3 | Complete and submit tender | Tender created with 2-envelope flag | [ ] | |
| 7.4 | Verify on detail page | Two-envelope indicator visible | [ ] | |

#### Test Case: CREATE-008 - Optional Fields
**Priority:** Medium | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 8.1 | Create tender with minimum required fields | Tender created successfully | [ ] | |
| 8.2 | Create tender with all optional fields | Fund Allocation, Bid Security, Pre-bid Meeting, Link | [ ] | |
| 8.3 | Verify optional fields saved | All optional data persisted | [ ] | |

#### Test Case: CREATE-009 - Access Control
**Priority:** Critical | **User Role:** Vendor

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 9.1 | Login as vendor | - | [ ] | |
| 9.2 | Try accessing `/tenders/new` | Access denied OR redirected | [ ] | |
| 9.3 | Verify error message | "You must be a buyer to create tenders" or similar | [ ] | |

---

### 7. Tender Detail Page (`/tenders/:id`)

#### Test Case: DETAIL-001 - View Tender Details (Buyer)
**Priority:** High | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1.1 | Login as buyer | - | [ ] | |
| 1.2 | Click on a tender from list | Detail page loads | [ ] | |
| 1.3 | Verify tender number | Displayed prominently | [ ] | |
| 1.4 | Verify title | Matches tender | [ ] | |
| 1.5 | Verify status badge | Correct color and text | [ ] | |
| 1.6 | Check all tender details | Type, Procurement Type, Dates, Budget, etc. | [ ] | |
| 1.7 | Verify action buttons (if draft) | "Publish", "Edit", "Delete" visible | [ ] | |
| 1.8 | Verify action buttons (if published) | "View Bids", "Addendum", "Questions" visible | [ ] | |

#### Test Case: DETAIL-002 - View Tender Details (Vendor)
**Priority:** High | **User Role:** Vendor

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 2.1 | Login as vendor | - | [ ] | |
| 2.2 | Navigate to published tender | Detail page loads | [ ] | |
| 2.3 | Verify can view details | All public info visible | [ ] | |
| 2.4 | Check action buttons | "Submit Bid", "Ask Question" visible | [ ] | |
| 2.5 | Verify buyer-only actions hidden | No "Edit", "Delete", "Award" buttons | [ ] | |
| 2.6 | Try viewing draft tender | Access denied OR tender not listed | [ ] | |

#### Test Case: DETAIL-003 - Tender Actions (Buyer)
**Priority:** High | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 3.1 | Create draft tender | Tender in draft state | [ ] | |
| 3.2 | Click "Publish" button | Confirmation dialog appears | [ ] | |
| 3.3 | Confirm publish | Status changes to "published" | [ ] | |
| 3.4 | Verify status update | Badge and status reflect change | [ ] | |
| 3.5 | Click "Edit" (if allowed) | Redirected to edit form | [ ] | |
| 3.6 | Verify cannot edit published tender | Edit button disabled or missing | [ ] | |

---

### 8. Tender Items/Features (if implemented)

#### Test Case: ITEMS-001 - Add Tender Items
**Priority:** Medium | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1.1 | Open tender detail page | Items section visible | [ ] | |
| 1.2 | Click "Add Item" | Item form appears | [ ] | |
| 1.3 | Fill item details | Description, Quantity, Unit, etc. | [ ] | |
| 1.4 | Save item | Item added to tender | [ ] | |
| 1.5 | Edit item | Changes saved | [ ] | |
| 1.6 | Delete item | Item removed | [ ] | |

### 9. Simple RFQ (Quick RFQ Creation)

#### Test Case: SIMPLE-001 - Create Simple RFQ
**Priority:** Critical | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1.1 | Navigate to `/tenders/new/simple-rfq` | Simple RFQ form displays | [ ] | |
| 1.2 | Fill required fields (title, description, budget) | No errors | [ ] | |
| 1.3 | Select procurement type: Goods/Works/Services | Cost ranges appear | [ ] | |
| 1.4 | Choose cost range (e.g., up to 8 Lac BDT) | Tender type auto‑suggested | [ ] | |
| 1.5 | Optionally add items | Item table expands | [ ] | |
| 1.6 | Set deadline (default 7 days) | Date accepted | [ ] | |
| 1.7 | Click “Create Simple RFQ” | RFQ created, redirected to detail page | [ ] | |
| 1.8 | Verify RFQ appears in tender list | Listed with “Simple RFQ” tag | [ ] | |
| 1.9 | Check that RFQ is automatically published | Status “published” | [ ] | |

#### Test Case: SIMPLE-002 - Simple RFQ Validation
**Priority:** High | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 2.1 | Submit empty form | Validation errors for required fields | [ ] | |
| 2.2 | Enter budget < 0 | Error “Budget must be positive” | [ ] | |
| 2.3 | Enter budget > cost‑range limit | Error “Budget exceeds allowed limit” | [ ] | |
| 2.4 | Set deadline in past | Error “Deadline must be in future” | [ ] | |
| 2.5 | Try to submit with no procurement type | Error “Select a procurement type” | [ ] | |

#### Test Case: SIMPLE-003 - Simple RFQ vs Standard Tender
**Priority:** Medium | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 3.1 | Compare Simple RFQ form with standard form | Fewer fields, streamlined workflow | [ ] | |
| 3.2 | Verify no two‑envelope option | Checkbox absent | [ ] | |
| 3.3 | Verify no special‑condition flags | No international/turnkey/emergency checkboxes | [ ] | |
| 3.4 | Check default notification settings | Vendors notified automatically | [ ] | |

### 10. Limited Tendering (Restricted Vendor Invitation)

#### Test Case: LIMITED-001 - Create Limited Tender
**Priority:** Critical | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1.1 | Navigate to limited tender creation (`/tenders/new/limited`) | Limited tender form displays | [ ] | |
| 1.2 | Select a base tender (or create new) | Tender details pre‑filled | [ ] | |
| 1.3 | Search and select invited vendors (min 3) | Vendors added to invite list | [ ] | |
| 1.4 | Set invitation deadline | Date accepted | [ ] | |
| 1.5 | Enable “auto‑accept invited vendors” | Toggle works | [ ] | |
| 1.6 | Publish limited tender | Tender published, invitations sent | [ ] | |
| 1.7 | Verify vendor notifications | Invited vendors receive email/notification | [ ] | |

#### Test Case: LIMITED-002 - Vendor Acceptance Flow
**Priority:** High | **User Role:** Vendor

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 2.1 | Invited vendor logs in | Notification of limited tender invitation | [ ] | |
| 2.2 | Click invitation link | Redirect to tender detail with “Accept/Decline” buttons | [ ] | |
| 2.3 | Click “Accept” | Vendor added to tender’s participant list | [ ] | |
| 2.4 | Click “Decline” | Vendor removed from invite list, cannot bid | [ ] | |
| 2.5 | After acceptance, verify bid access | Can submit bid like normal tender | [ ] | |

#### Test Case: LIMITED-003 - Non‑invited Vendor Access
**Priority:** High | **User Role:** Vendor

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 3.1 | Non‑invited vendor views tender list | Limited tender appears with “Limited” tag | [ ] | |
| 3.2 | Try to access limited tender detail | Access denied (403) or “Not Invited” message | [ ] | |
| 3.3 | Try to submit bid via API | 403 Forbidden | [ ] | |
| 3.4 | Verify cannot see bid list | Bid list hidden from non‑invited vendors | [ ] | |

#### Test Case: LIMITED-004 - Buyer Management of Invitations
**Priority:** Medium | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 4.1 | Edit limited tender after creation | Invite list editable before deadline | [ ] | |
| 4.2 | Add new vendor to invite list | New invitation sent | [ ] | |
| 4.3 | Remove vendor from invite list | Vendor removed, cannot accept | [ ] | |
| 4.4 | Extend invitation deadline | Deadline updated, vendors notified | [ ] | |
| 4.5 | Close limited tender early | Bidding disabled, finalize manually | [ ] | |

---


## Live Tendering

### 11. Live Auction Creation (`/tenders/new/live-auction`)

#### Test Case: LIVE-001 - Create Live Auction
**Priority:** Critical | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1.1 | Navigate to `/tenders/new/live-auction` | Live auction form displays | [ ] | |
| 1.2 | Select a published tender from dropdown | Tender selected, details displayed | [ ] | |
| 1.3 | Enter scheduled start (future datetime) | Date accepted | [ ] | |
| 1.4 | Enter scheduled end (after start) | Date accepted | [ ] | |
| 1.5 | Choose bidding type "open_auction" | Bidding type selected | [ ] | |
| 1.6 | Set minimum bid increment to 1000 | Value saved | [ ] | |
| 1.7 | Enable auto-extend on last minute | Checkbox checked | [ ] | |
| 1.8 | Enter extension minutes 5 | Value saved | [ ] | |
| 1.9 | Leave limited vendors empty | No error | [ ] | |
| 1.10 | Click "Create Live Auction" | Session created, redirected to dashboard | [ ] | |
| 1.11 | Verify session appears in live sessions list | Session visible with status "scheduled" | [ ] | |

### 12. Live Dashboard (`/tenders/[id]/live-dashboard`)

#### Test Case: LIVE-002 - Live Dashboard Access
**Priority:** High | **User Role:** Buyer/Vendor

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 2.1 | As buyer, navigate to live dashboard (`/tenders/[id]/live-dashboard`) | Live dashboard loads with session details | [ ] | |
| 2.2 | Verify countdown timer | Timer displays correct time remaining | [ ] | |
| 2.3 | As invited vendor, access live dashboard | Vendor can view dashboard and submit bids | [ ] | |
| 2.4 | As non-invited vendor, attempt access | Access denied with appropriate message | [ ] | |
| 2.5 | Verify session status badges | Correct badge for scheduled/active/ended | [ ] | |

### 13. Real-time Bidding

#### Test Case: LIVE-003 - Real-time Bidding
**Priority:** Critical | **User Role:** Vendor

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 3.1 | During active session, enter bid amount | Bid amount accepted | [ ] | |
| 3.2 | Submit bid | Bid appears in bid history, SSE update received | [ ] | |
| 3.3 | Verify bid validation (minimum increment) | If bid below minimum, error shown | [ ] | |
| 3.4 | Verify bid withdrawal (if allowed) | Withdraw button works | [ ] | |
| 3.5 | Check bid visibility settings | Bids hidden/visible per configuration | [ ] | |

### 14. Session Management

#### Test Case: LIVE-004 - Session Management
**Priority:** High | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 4.1 | Start session manually (if option) | Session status changes to active | [ ] | |
| 4.2 | End session early | Session ends, bidding disabled | [ ] | |
| 4.3 | Verify auto-extend on last minute | Session extends when bid near end | [ ] | |
| 4.4 | Check session end triggers | Notifications sent, final bid ranking displayed | [ ] | |

### 15. Limited Vendor Access

#### Test Case: LIVE-005 - Limited Vendor Access
**Priority:** High | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 5.1 | During live auction creation, specify limited vendor IDs | Vendors invited | [ ] | |
| 5.2 | Verify only invited vendors can access | Non-invited vendors get access denied | [ ] | |
| 5.3 | Invite additional vendors after creation | Invitation sent, vendor can join | [ ] | |
| 5.4 | Remove vendor from invited list | Vendor loses access | [ ] | |

---

## Bid Management
### 16. Bid Creation & Submission

#### Test Case: BID-001 - Create Bid (Vendor)
**Priority:** Critical | **User Role:** Vendor

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1.1 | Login as vendor | - | [ ] | |
| 1.2 | Navigate to published tender | Detail page loads | [ ] | |
| 1.3 | Click "Submit Bid" or "Create Bid" | Bid form opens | [ ] | |
| 1.4 | Verify form fields | Price/Rate fields based on tender items | [ ] | |
| 1.5 | Enter bid prices | All required fields filled | [ ] | |
| 1.6 | Upload documents (if required) | Files upload successfully | [ ] | |
| 1.7 | Save as draft | Bid saved, can return later | [ ] | |
| 1.8 | Return to bid | Can edit draft bid | [ ] | |
| 1.9 | Click "Submit Bid" | Confirmation required | [ ] | |
| 1.10 | Confirm submission | Bid marked as submitted, cannot edit | [ ] | |

#### Test Case: BID-002 - Bid Validation
**Priority:** High | **User Role:** Vendor

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 2.1 | Try submit bid with missing prices | Validation error | [ ] | |
| 2.2 | Enter negative price | Validation error | [ ] | |
| 2.3 | Enter non-numeric price | Validation error | [ ] | |
| 2.4 | Try submit after deadline | "Deadline passed" error | [ ] | |
| 2.5 | Try submit duplicate bid | "Already submitted" error | [ ] | |

#### Test Case: BID-003 - Withdraw Bid
**Priority:** Medium | **User Role:** Vendor

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 3.1 | Submit a bid | Bid submitted | [ ] | |
| 3.2 | Before deadline, click "Withdraw" | Confirmation dialog | [ ] | |
| 3.3 | Confirm withdrawal | Bid withdrawn, can resubmit | [ ] | |
| 3.4 | Try withdraw after deadline | Withdrawal not allowed | [ ] | |

#### Test Case: BID-004 - Two-Envelope Bids
**Priority:** High | **User Role:** Vendor

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 4.1 | Open two-envelope tender | Bid form shows 2 envelopes | [ ] | |
| 4.2 | Fill Technical envelope | Technical docs/info | [ ] | |
| 4.3 | Fill Commercial envelope | Pricing info | [ ] | |
| 4.4 | Submit bid | Both envelopes submitted together | [ ] | |
| 4.5 | Verify commercial sealed | Commercial prices not visible until opened | [ ] | |

---

### 17. Bid Viewing (Buyer)

#### Test Case: BIDVIEW-001 - View All Bids
**Priority:** High | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1.1 | Login as buyer | - | [ ] | |
| 1.2 | Open own published tender | Detail page | [ ] | |
| 1.3 | Click "View Bids" | List of bids displays | [ ] | |
| 1.4 | Verify bid count | Matches actual submissions | [ ] | |
| 1.5 | Click individual bid | Bid detail page | [ ] | |
| 1.6 | Verify cannot see bids before deadline | Bids hidden or prices masked | [ ] | Check policy |

#### Test Case: BIDVIEW-002 - Two-Envelope Opening
**Priority:** High | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 2.1 | Navigate to closed 2-envelope tender | Tender past deadline | [ ] | |
| 2.2 | Click "Open Technical Envelopes" | Technical bids revealed | [ ] | |
| 2.3 | Verify commercial still sealed | Prices not visible | [ ] | |
| 2.4 | Complete technical evaluation | - | [ ] | |
| 2.5 | Click "Unlock Commercial Envelopes" | Select qualified bids | [ ] | |
| 2.6 | Confirm unlock | Commercial prices revealed for qualified bids | [ ] | |

---

## Evaluation & Awards

### 18. Evaluation Process

#### Test Case: EVAL-001 - Technical Evaluation
**Priority:** High | **User Role:** Buyer/Evaluator

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1.1 | Open tender with submitted bids | Bids list | [ ] | |
| 1.2 | Click "Evaluate" on a bid | Evaluation form opens | [ ] | |
| 1.3 | Enter technical scores | Score fields validated | [ ] | |
| 1.4 | Add comments | Text saved | [ ] | |
| 1.5 | Mark as "Technically Qualified" or "Disqualified" | Status updated | [ ] | |
| 1.6 | Save evaluation | Evaluation recorded | [ ] | |
| 1.7 | Repeat for all bids | All evaluated | [ ] | |

#### Test Case: EVAL-002 - Commercial Evaluation
**Priority:** High | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 2.1 | Ensure commercial envelopes unlocked | Prices visible | [ ] | |
| 2.2 | Click "Calculate Commercial Scores" | System calculates based on prices | [ ] | |
| 2.3 | View comparison matrix | All qualified bids compared | [ ] | |
| 2.4 | Verify price ranking | Lowest price ranked highest | [ ] | |
| 2.5 | View final ranking | Combined tech + commercial scores | [ ] | |

#### Test Case: EVAL-003 - Award Tender
**Priority:** Critical | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 3.1 | Complete all evaluations | Rankings available | [ ] | |
| 3.2 | Click "Award" on winning bid | Award form opens | [ ] | |
| 3.3 | Enter award details | Contract value, notes, etc. | [ ] | |
| 3.4 | Confirm award | Status changes to "awarded" | [ ] | |
| 3.5 | Verify notifications sent | Vendor and other bidders notified | [ ] | |
| 3.6 | Check tender status | Marked as "awarded" | [ ] | |

#### Test Case: EVAL-004 - Bulk Awards (if applicable)
**Priority:** Medium | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 4.1 | Open tender allowing multiple awards | - | [ ] | |
| 4.2 | Select multiple bids | Checkboxes selected | [ ] | |
| 4.3 | Click "Bulk Award" | Award form for all selected | [ ] | |
| 4.4 | Confirm | All awards created | [ ] | |

---

## Vendor Management

### 19. Vendor List & Profile

#### Test Case: VEND-001 - View Vendor List (Buyer)
**Priority:** High | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1.1 | Login as buyer | - | [ ] | |
| 1.2 | Navigate to `/vendors` | Vendor list displays | [ ] | |
| 1.3 | Verify vendor cards/list | Name, email, status visible | [ ] | |
| 1.4 | Search for vendor | Filter works | [ ] | |
| 1.5 | Click vendor | Profile page opens | [ ] | |

#### Test Case: VEND-002 - Vendor Profile Management (Vendor)
**Priority:** High | **User Role:** Vendor

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 2.1 | Login as vendor | - | [ ] | |
| 2.2 | Navigate to `/profile` or `/vendors/profile` | Own profile displays | [ ] | |
| 2.3 | Click "Edit Profile" | Edit form appears | [ ] | |
| 2.4 | Update company name | Change saved | [ ] | |
| 2.5 | Update contact info | Change saved | [ ] | |
| 2.6 | Upload company documents | Files uploaded | [ ] | |
| 2.7 | Add certifications | Saved to profile | [ ] | |
| 2.8 | Save changes | Profile updated | [ ] | |

#### Test Case: VEND-003 - Vendor Access Control
**Priority:** High | **User Role:** Vendor

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 3.1 | Try accessing another vendor's profile | Access denied | [ ] | |
| 3.2 | Try editing another vendor's profile | Not allowed | [ ] | |
| 3.3 | Try accessing `/vendors` list page | Denied or limited view | [ ] | |

---

## Profile Management

### Profile Page

#### Test Case: PROF-001 - View Profile (All Users)
**Priority:** High | **User Role:** All

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1.1 | Login as any user | Dashboard loads | [ ] | |
| 1.2 | Click "Profile" in navigation | Profile page loads | [ ] | |
| 1.3 | Verify profile details | Name, email, role, organization displayed | [ ] | |
| 1.4 | Verify edit button | "Edit Profile" button visible | [ ] | |

#### Test Case: PROF-002 - Edit Profile (All Users)
**Priority:** High | **User Role:** All

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 2.1 | Navigate to profile page | - | [ ] | |
| 2.2 | Click "Edit Profile" | Edit form appears with current values | [ ] | |
| 2.3 | Change name | New name saved | [ ] | |
| 2.4 | Change email (if allowed) | Validation, confirmation required | [ ] | |
| 2.5 | Change password | Password updated, re-login may be required | [ ] | |
| 2.6 | Save changes | Success message, profile updated | [ ] | |
| 2.7 | Cancel edit | Return to view mode without changes | [ ] | |

#### Test Case: PROF-003 - Profile Access Control
**Priority:** High | **User Role:** All

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 3.1 | As a user, try to access another user's profile via URL | Access denied (403) or redirect to own profile | [ ] | |
| 3.2 | Verify API endpoint security | Cannot update another user's profile | [ ] | |

---

## Document Management

### 23. Document Checklist & Upload

#### Test Case: DOC-001 - View Document Requirements (Buyer)
**Priority:** High | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1.1 | Login as buyer | - | [ ] | |
| 1.2 | Create or edit a tender | Tender form displays | [ ] | |
| 1.3 | Navigate to Document Checklist section | Checklist appears | [ ] | |
| 1.4 | Verify required documents | List of required docs based on tender type | [ ] | |
| 1.5 | Verify optional documents | List of optional docs | [ ] | |
| 1.6 | Check document status indicators | Required/Optional/Submitted/Not Submitted | [ ] | |

#### Test Case: DOC-002 - Upload Tender Documents (Buyer)
**Priority:** High | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 2.1 | Navigate to Document Checklist section | Checklist appears | [ ] | |
| 2.2 | Click "Upload" for a required document | File picker opens | [ ] | |
| 2.3 | Select a valid file (PDF, DOC, etc.) | File selected | [ ] | |
| 2.4 | Click "Upload" | Upload progress indicator shown | [ ] | |
| 2.5 | Verify upload completion | Document marked as "Submitted" | [ ] | |
| 2.6 | Try uploading invalid file type | Error message "Invalid file type" | [ ] | |
| 2.7 | Try uploading file > 10MB | Error message "File too large" | [ ] | |
| 2.8 | Delete uploaded document | Document removed, status resets | [ ] | |

#### Test Case: DOC-003 - Upload Bid Documents (Vendor)
**Priority:** High | **User Role:** Vendor

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 3.1 | Login as vendor | - | [ ] | |
| 3.2 | Navigate to published tender | Tender detail page | [ ] | |
| 3.3 | Click "Submit Bid" | Bid form opens | [ ] | |
| 3.4 | Navigate to Document Upload section | Upload area appears | [ ] | |
| 3.5 | Verify required bid documents | List of required docs | [ ] | |
| 3.6 | Upload required documents | Files uploaded successfully | [ ] | |
| 3.7 | Verify document preview | Preview thumbnail or icon shown | [ ] | |
| 3.8 | Submit bid without required documents | Error "Please upload all required documents" | [ ] | |

#### Test Case: DOC-004 - Document Download (All Users)
**Priority:** Medium | **User Role:** All

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 4.1 | View tender with uploaded documents | Document list visible | [ ] | |
| 4.2 | Click on a document | Download starts or preview opens | [ ] | |
| 4.3 | Verify file integrity | Downloaded file matches original | [ ] | |
| 4.4 | Try downloading without authentication | Access denied | [ ] | |

---

### 24. Export Functionality

#### Test Case: EXPORT-001 - Export Tender List (Buyer)
**Priority:** Medium | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1.1 | Login as buyer | - | [ ] | |
| 1.2 | Navigate to `/tenders` | Tender list displays | [ ] | |
| 1.3 | Click "Export" button | Export options appear | [ ] | |
| 1.4 | Select format: "Excel" | File downloads as .xlsx | [ ] | |
| 1.5 | Select format: "PDF" | File downloads as .pdf | [ ] | |
| 1.6 | Select format: "CSV" | File downloads as .csv | [ ] | |
| 1.7 | Verify exported data | All visible tenders included | [ ] | |
| 1.8 | Apply filters, then export | Only filtered tenders exported | [ ] | |

#### Test Case: EXPORT-002 - Export Bid List (Buyer)
**Priority:** Medium | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 2.1 | Open tender with submitted bids | Bids list visible | [ ] | |
| 2.2 | Click "Export Bids" | Export options appear | [ ] | |
| 2.3 | Select format: "Excel" | File downloads as .xlsx | [ ] | |
| 2.4 | Verify exported data | All bids with details included | [ ] | |
| 2.5 | Verify commercial prices hidden (if 2-envelope) | Prices not exported until opened | [ ] | |

#### Test Case: EXPORT-003 - Export Vendor List (Buyer/Admin)
**Priority:** Medium | **User Role:** Buyer/Admin

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 3.1 | Navigate to `/vendors` | Vendor list displays | [ ] | |
| 3.2 | Click "Export Vendors" | Export options appear | [ ] | |
| 3.3 | Select format: "Excel" | File downloads as .xlsx | [ ] | |
| 3.4 | Verify exported data | All vendors with details included | [ ] | |
| 3.5 | Apply filters, then export | Only filtered vendors exported | [ ] | |

#### Test Case: EXPORT-004 - Export Audit Logs (Admin)
**Priority:** Low | **User Role:** Admin

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 4.1 | Login as admin | - | [ ] | |
| 4.2 | Navigate to `/admin/audit` | Audit log list | [ ] | |
| 4.3 | Apply filters (date range, user, action) | Logs filtered | [ ] | |
| 4.4 | Click "Export" | File downloads as .xlsx | [ ] | |
| 4.5 | Verify exported data | Only filtered logs included | [ ] | |

---

### 25. Organization Type Selection

#### Test Case: ORG-001 - Organization Type in Registration
**Priority:** Critical | **User Role:** Anonymous

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1.1 | Navigate to `/register` | Registration form displays | [ ] | |
| 1.2 | Verify organization type field | "Government" or "Non-government" options visible | [ ] | |
| 1.3 | Select "Government" | Tender types limited to PG1-PG9A, PW1-PW3, PPS2-PPS6 | [ ] | |
| 1.4 | Select "Non-government" | Tender types limited to NRQ1-NRQ3 | [ ] | |
| 1.5 | Complete registration with Government type | Account created with Government type | [ ] | |
| 1.6 | Complete registration with Non-government type | Account created with Non-government type | [ ] | |

#### Test Case: ORG-002 - Dashboard Options by Organization Type
**Priority:** High | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 2.1 | Login as Government buyer | Dashboard loads | [ ] | |
| 2.2 | Verify "Create Detailed RFT" button | Visible | [ ] | |
| 2.3 | Verify "Create Live Tendering" button | Visible | [ ] | |
| 2.4 | Verify NO "Simple RFQ" button | Not visible | [ ] | |
| 2.5 | Logout, login as Non-government buyer | Dashboard loads | [ ] | |
| 2.6 | Verify "Create Simple RFQ" button | Visible | [ ] | |
| 2.7 | Verify "Create Live Tendering" button | Visible | [ ] | |
| 2.8 | Verify NO "Create Detailed RFT" button | Not visible | [ ] | |

#### Test Case: ORG-003 - Tender Type Availability by Organization
**Priority:** High | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 3.1 | Login as Government buyer | - | [ ] | |
| 3.2 | Navigate to `/tenders/new` | Tender creation form | [ ] | |
| 3.3 | Verify tender type dropdown | Shows PG1-PG9A, PW1-PW3, PPS2-PPS6 | [ ] | |
| 3.4 | Verify NO NRQ types | NRQ1-NRQ3 not available | [ ] | |
| 3.5 | Logout, login as Non-government buyer | - | [ ] | |
| 3.6 | Navigate to `/tenders/new` | Tender creation form | [ ] | |
| 3.7 | Verify tender type dropdown | Shows NRQ1-NRQ3 | [ ] | |
| 3.8 | Verify NO Government types | PG/PW/PPS types not available | [ ] | |

---

### 26. Security Calculation & Value Validation

#### Test Case: SEC-CALC-001 - Bid Security Calculation
**Priority:** High | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1.1 | Create tender with bid security | Bid security field visible | [ ] | |
| 1.2 | Enter estimated cost: 500000 BDT | No errors | [ ] | |
| 1.3 | Set bid security percentage: 2% | System calculates: 10000 BDT | [ ] | |
| 1.4 | Verify calculated amount | Displayed correctly | [ ] | |
| 1.5 | Change percentage to 5% | System recalculates: 25000 BDT | [ ] | |
| 1.6 | Enter fixed amount: 15000 BDT | Fixed amount used instead of percentage | [ ] | |
| 1.7 | Save tender | Bid security requirement saved | [ ] | |

#### Test Case: SEC-CALC-002 - Value Validation Against Cost Range
**Priority:** High | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 2.1 | Select procurement type: "Goods" | Cost ranges appear | [ ] | |
| 2.2 | Select cost range: "Up to 8 Lac BDT" | Range selected | [ ] | |
| 2.3 | Enter estimated cost: 500000 BDT | Within range, no error | [ ] | |
| 2.4 | Enter estimated cost: 900000 BDT | Error "Cost exceeds selected range" | [ ] | |
| 2.5 | Enter estimated cost: 100000 BDT | Within range, no error | [ ] | |
| 2.6 | Change cost range to "8 Lac - 25 Lac" | Range updated | [ ] | |
| 2.7 | Enter estimated cost: 900000 BDT | Within new range, no error | [ ] | |
| 2.8 | Enter estimated cost: 3000000 BDT | Error "Cost exceeds selected range" | [ ] | |

#### Test Case: SEC-CALC-003 - Bid Value Validation
**Priority:** High | **User Role:** Vendor

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 3.1 | Login as vendor | - | [ ] | |
| 3.2 | Navigate to tender with bid security | Tender detail page | [ ] | |
| 3.3 | Click "Submit Bid" | Bid form opens | [ ] | |
| 3.4 | Enter bid amount: 450000 BDT | Within range, no error | [ ] | |
| 3.5 | Enter bid amount: 0 BDT | Error "Bid amount must be positive" | [ ] | |
| 3.6 | Enter bid amount: -10000 BDT | Error "Bid amount must be positive" | [ ] | |
| 3.7 | Enter bid amount: 1000000 BDT | Error "Bid amount exceeds tender budget" | [ ] | |
| 3.8 | Verify bid security requirement | Displayed on bid form | [ ] | |
| 3.9 | Submit bid without bid security document | Error "Bid security document required" | [ ] | |

---

## Notifications & Communications

### 27. Questions & Clarifications

#### Test Case: CLARIF-001 - Ask Question (Vendor)
**Priority:** High | **User Role:** Vendor

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1.1 | Login as vendor | - | [ ] | |
| 1.2 | Open published tender | Detail page | [ ] | |
| 1.3 | Click "Ask Question" or Questions tab | Question form | [ ] | |
| 1.4 | Enter question text | Text entered | [ ] | |
| 1.5 | Submit question | Question posted, status "pending" | [ ] | |
| 1.6 | Verify notification sent to buyer | Buyer receives notification | [ ] | |

#### Test Case: CLARIF-002 - Answer Question (Buyer)
**Priority:** High | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 2.1 | Login as buyer | - | [ ] | |
| 2.2 | Receive question notification | Notification visible | [ ] | |
| 2.3 | Navigate to tender questions | List of questions | [ ] | |
| 2.4 | Click on pending question | Question detail | [ ] | |
| 2.5 | Enter answer | Text field | [ ] | |
| 2.6 | Check "Make Public" (if option exists) | Toggle visible | [ ] | |
| 2.7 | Submit answer | Answer posted | [ ] | |
| 2.8 | Verify vendor notified | Vendor receives answer notification | [ ] | |
| 2.9 | Verify public visibility | Answer visible to all vendors if public | [ ] | |

#### Test Case: CLARIF-003 - Close Question
**Priority:** Medium | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 3.1 | Open answered question | - | [ ] | |
| 3.2 | Click "Close Question" | Status changes to "closed" | [ ] | |
| 3.3 | Verify no further replies allowed | Question locked | [ ] | |

---

### 28. Addenda

#### Test Case: ADDEND-001 - Create Addendum (Buyer)
**Priority:** High | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1.1 | Login as buyer | - | [ ] | |
| 1.2 | Open published tender | - | [ ] | |
| 1.3 | Click "Create Addendum" | Addendum form | [ ] | |
| 1.4 | Enter title and description | Text entered | [ ] | |
| 1.5 | Upload supporting documents | Files uploaded | [ ] | |
| 1.6 | Check "Extend Deadline" (if applicable) | New deadline field appears | [ ] | |
| 1.7 | Submit addendum | Addendum published | [ ] | |
| 1.8 | Verify vendors notified | All registered vendors receive notification | [ ] | |

#### Test Case: ADDEND-002 - Acknowledge Addendum (Vendor)
**Priority:** High | **User Role:** Vendor

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 2.1 | Receive addendum notification | Notification shown | [ ] | |
| 2.2 | Navigate to tender addenda | List of addenda | [ ] | |
| 2.3 | View addendum | Content and documents visible | [ ] | |
| 2.4 | Click "Acknowledge" | Acknowledgment recorded | [ ] | |
| 2.5 | Verify cannot bid without acknowledging | Bid submission requires ack (if policy) | [ ] | |

#### Test Case: ADDEND-003 - Unacknowledged Addenda
**Priority:** Medium | **User Role:** Vendor

| Step | Action | expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 3.1 | Check for unacknowledged addenda | Badge/indicator on tender | [ ] | |
| 3.2 | View list of unacknowledged | Separate tab or filter | [ ] | |
| 3.3 | Acknowledge all | Bulk acknowledge option | [ ] | |

---

### 29. Notifications

#### Test Case: NOTIF-001 - Notification List
**Priority:** Medium | **User Role:** All

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1.1 | Navigate to `/notifications` (if route exists) | Notification list | [ ] | |
| 1.2 | Verify unread count | Badge shows count | [ ] | |
| 1.3 | Click notification | Redirects to relevant page | [ ] | |
| 1.4 | Verify marked as read | No longer in unread count | [ ] | |

#### Test Case: NOTIF-002 - Notification Types
**Priority:** Medium | **User Role:** All

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 2.1 | Trigger various notifications | - | [ ] | Setup |
| 2.2 | Verify "New Tender Published" (Vendor) | Notification received | [ ] | |
| 2.3 | Verify "Bid Submitted" (Buyer) | Notification received | [ ] | |
| 2.4 | Verify "Question Asked" (Buyer) | Notification received | [ ] | |
| 2.5 | Verify "Question Answered" (Vendor) | Notification received | [ ] | |
| 2.6 | Verify "Addendum Posted" (Vendor) | Notification received | [ ] | |
| 2.7 | Verify "Tender Awarded" (Vendor) | Notification received | [ ] | |

---

## Admin Functions

### 30. Tax Rules Management

#### Test Case: TAX-001 - Create Tax Rule (Admin)
**Priority:** Medium | **User Role:** Admin

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1.1 | Login as admin | - | [ ] | |
| 1.2 | Navigate to `/admin/tax-rules` | Tax rules list | [ ] | |
| 1.3 | Click "Create Tax Rule" | Form appears | [ ] | |
| 1.4 | Enter rule details | Name, rate, type, etc. | [ ] | |
| 1.5 | Save | Tax rule created | [ ] | |
| 1.6 | Verify in list | Appears in tax rules | [ ] | |

#### Test Case: TAX-002 - Edit/Delete Tax Rule
**Priority:** Medium | **User Role:** Admin

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 2.1 | Click "Edit" on tax rule | Edit form | [ ] | |
| 2.2 | Update rate | Change saved | [ ] | |
| 2.3 | Click "Delete" | Confirmation dialog | [ ] | |
| 2.4 | Confirm delete | Rule removed | [ ] | |

---

### 31. Currency Management

#### Test Case: CURR-001 - View Currency Rates (All)
**Priority:** Low | **User Role:** All

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1.1 | Navigate to currency rates page | List of rates | [ ] | |
| 1.2 | Verify BDT base rates | All conversions shown | [ ] | |
| 1.3 | Check rate age | Last updated timestamp | [ ] | |

#### Test Case: CURR-002 - Refresh Currency Rates (Admin)
**Priority:** Medium | **User Role:** Admin

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 2.1 | Login as admin | - | [ ] | |
| 2.2 | Navigate to `/admin/currency` | Currency admin page | [ ] | |
| 2.3 | Click "Refresh Rates" | API call initiated | [ ] | |
| 2.4 | Verify rates updated | Timestamp changes | [ ] | |

---

### 32. Audit Logs

#### Test Case: AUDIT-001 - View Audit Logs (Admin)
**Priority:** Low | **User Role:** Admin

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1.1 | Login as admin | - | [ ] | |
| 1.2 | Navigate to `/admin/audit` | Audit log list | [ ] | |
| 1.3 | Filter by user | Logs filtered | [ ] | |
| 1.4 | Filter by action type | Logs filtered | [ ] | |
| 1.5 | View log details | Full log entry visible | [ ] | |

---

## Role-Based Access Control

### 33. RBAC Matrix Testing

#### Test Case: RBAC-001 - Buyer Role Access
**Priority:** Critical | **User Role:** Buyer

| Route/Feature | Expected Access | Status | Notes |
|---------------|----------------|--------|-------|
| `/dashboard` | ✅ Allow | [ ] | |
| `/tenders` | ✅ Allow | [ ] | |
| `/tenders/new` | ✅ Allow | [ ] | |
| `/tenders/:id` (own) | ✅ Allow | [ ] | |
| `/tenders/:id` (other buyer) | ✅ Allow (read-only) | [ ] | |
| `/tenders/:id/edit` (own) | ✅ Allow | [ ] | |
| `/tenders/:id/bids` | ✅ Allow | [ ] | |
| `/tenders/:id/evaluate` | ✅ Allow | [ ] | |
| `/tenders/:id/award` | ✅ Allow | [ ] | |
| `/vendors` | ✅ Allow | [ ] | |
| `/vendors/:id` | ✅ Allow | [ ] | |
| `/bids/create` | ❌ Deny | [ ] | |
| `/admin/*` | ❌ Deny | [ ] | |

#### Test Case: RBAC-002 - Vendor Role Access
**Priority:** Critical | **User Role:** Vendor

| Route/Feature | Expected Access | Status | Notes |
|---------------|----------------|--------|-------|
| `/dashboard` | ✅ Allow | [ ] | |
| `/tenders` | ✅ Allow (published only) | [ ] | |
| `/tenders/:id` (published) | ✅ Allow | [ ] | |
| `/tenders/:id` (draft) | ❌ Deny | [ ] | |
| `/tenders/new` | ❌ Deny | [ ] | |
| `/tenders/:id/edit` | ❌ Deny | [ ] | |
| `/bids/create` | ✅ Allow | [ ] | |
| `/bids/:id` (own) | ✅ Allow | [ ] | |
| `/bids/:id` (other vendor) | ❌ Deny | [ ] | |
| `/tenders/:id/bids` (all bids) | ❌ Deny | [ ] | |
| `/vendors` | ❌ Deny (list) | [ ] | |
| `/vendors/profile` (own) | ✅ Allow | [ ] | |
| `/tenders/:id/award` | ❌ Deny | [ ] | |
| `/admin/*` | ❌ Deny | [ ] | |

#### Test Case: RBAC-003 - Admin Role Access
**Priority:** Critical | **User Role:** Admin

| Route/Feature | Expected Access | Status | Notes |
|---------------|----------------|--------|-------|
| All buyer routes | ✅ Allow | [ ] | |
| All public routes | ✅ Allow | [ ] | |
| `/admin/tax-rules` | ✅ Allow | [ ] | |
| `/admin/currency` | ✅ Allow | [ ] | |
| `/admin/audit` | ✅ Allow | [ ] | |
| `/admin/users` (if exists) | ✅ Allow | [ ] | |

#### Test Case: RBAC-004 - Unauthorized Access Attempts
**Priority:** Critical | **User Role:** All

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 4.1 | As Vendor, navigate to `/tenders/new` | Redirected or 403 error | [ ] | |
| 4.2 | As Vendor, navigate to `/admin/tax-rules` | Redirected or 403 error | [ ] | |
| 4.3 | As Buyer, navigate to `/admin/audit` | Redirected or 403 error | [ ] | |
| 4.4 | As Buyer, try to create bid (API call) | 403 Forbidden | [ ] | |
| 4.5 | As Vendor, try to award tender (API call) | 403 Forbidden | [ ] | |
| 4.6 | Unauthenticated user access `/dashboard` | Redirect to `/login` | [ ] | |

---

## End-to-End Workflow Testing

### 40. Complete Tender Lifecycle Workflow

#### Test Case: WORKFLOW-001 - Full Tender to Award Process (Government Buyer)
**Priority:** Critical | **User Role:** Multiple

| Step | Action | User Role | Expected Result | Status | Notes |
|------|--------|-----------|-----------------|--------|-------|
| 1.1 | Register as Government Buyer | Anonymous | Account created with Government type | [ ] | |
| 1.2 | Login as Government Buyer | Buyer | Dashboard loads with Government options | [ ] | |
| 1.3 | Create Detailed RFT tender | Buyer | Tender created in draft status | [ ] | |
| 1.4 | Add tender items (3 items) | Buyer | Items saved to tender | [ ] | |
| 1.5 | Upload required documents | Buyer | Documents attached to tender | [ ] | |
| 1.6 | Publish tender | Buyer | Tender status changed to "published" | [ ] | |
| 1.7 | Verify vendor notifications | System | Vendors receive notification | [ ] | Check email/notifications |
| 1.8 | Register as Vendor 1 | Anonymous | Account created | [ ] | |
| 1.9 | Register as Vendor 2 | Anonymous | Account created | [ ] | |
| 1.10 | Register as Vendor 3 | Anonymous | Account created | [ ] | |
| 1.11 | Vendor 1 views tender | Vendor 1 | Tender details visible | [ ] | |
| 1.12 | Vendor 1 asks question | Vendor 1 | Question posted, buyer notified | [ ] | |
| 1.13 | Buyer answers question publicly | Buyer | Answer visible to all vendors | [ ] | |
| 1.14 | Vendor 2 submits bid | Vendor 2 | Bid submitted successfully | [ ] | |
| 1.15 | Vendor 3 submits bid | Vendor 3 | Bid submitted successfully | [ ] | |
| 1.16 | Vendor 1 submits bid | Vendor 1 | Bid submitted successfully | [ ] | |
| 1.17 | Wait for submission deadline | System | Deadline passes | [ ] | |
| 1.18 | Buyer views all bids | Buyer | 3 bids visible with details | [ ] | |
| 1.19 | Buyer evaluates bids technically | Buyer | Technical scores entered | [ ] | |
| 1.20 | Buyer evaluates bids commercially | Buyer | Commercial scores calculated | [ ] | |
| 1.21 | Buyer awards tender to winning vendor | Buyer | Tender status changed to "awarded" | [ ] | |
| 1.22 | Verify winning vendor notification | System | Winner notified via email | [ ] | |
| 1.23 | Verify losing vendor notifications | System | Losers notified via email | [ ] | |
| 1.24 | Export tender report | Buyer | PDF/Excel report generated | [ ] | |

#### Test Case: WORKFLOW-002 - Simple RFQ Workflow (Non-Government Buyer)
**Priority:** Critical | **User Role:** Multiple

| Step | Action | User Role | Expected Result | Status | Notes |
|------|--------|-----------|-----------------|--------|-------|
| 2.1 | Register as Non-Government Buyer | Anonymous | Account created with Non-Govt type | [ ] | |
| 2.2 | Login as Non-Government Buyer | Buyer | Dashboard loads with Non-Govt options | [ ] | |
| 2.3 | Create Simple RFQ | Buyer | RFQ created and auto-published | [ ] | |
| 2.4 | Verify RFQ appears in tender list | System | RFQ visible to vendors | [ ] | |
| 2.5 | Vendor submits bid | Vendor | Bid submitted successfully | [ ] | |
| 2.6 | Buyer awards RFQ immediately | Buyer | RFQ awarded to vendor | [ ] | |
| 2.7 | Verify notification sent | System | Vendor notified of award | [ ] | |

#### Test Case: WORKFLOW-003 - Live Auction Workflow
**Priority:** Critical | **User Role:** Multiple

| Step | Action | User Role | Expected Result | Status | Notes |
|------|--------|-----------|-----------------|--------|-------|
| 3.1 | Buyer creates standard tender | Buyer | Tender published | [ ] | |
| 3.2 | Buyer creates live auction session | Buyer | Auction scheduled | [ ] | |
| 3.3 | Multiple vendors join auction | Vendors | Vendors can see live dashboard | [ ] | |
| 3.4 | Auction starts automatically | System | Status changes to "active" | [ ] | |
| 3.5 | Vendor 1 submits bid | Vendor 1 | Bid appears in real-time | [ ] | |
| 3.6 | Vendor 2 submits lower bid | Vendor 2 | Bid updates in real-time | [ ] | |
| 3.7 | Vendor 1 submits even lower bid | Vendor 1 | Bid updates, ranking changes | [ ] | |
| 3.8 | Auto-extend triggers (last minute bid) | System | Auction extends by 5 minutes | [ ] | |
| 3.9 | Auction ends | System | Status changes to "ended" | [ ] | |
| 3.10 | Buyer awards to lowest bidder | Buyer | Tender awarded | [ ] | |

#### Test Case: WORKFLOW-004 - Limited Tendering Workflow
**Priority:** High | **User Role:** Multiple

| Step | Action | User Role | Expected Result | Status | Notes |
|------|--------|-----------|-----------------|--------|-------|
| 4.1 | Buyer selects 3 specific vendors | Buyer | Vendors selected for invitation | [ ] | |
| 4.2 | Buyer creates limited tender | Buyer | Tender created with limited access | [ ] | |
| 4.3 | Invited vendors receive notifications | System | Email/notification sent | [ ] | |
| 4.4 | Invited Vendor 1 accepts invitation | Vendor 1 | Can access tender and submit bid | [ ] | |
| 4.5 | Invited Vendor 2 declines invitation | Vendor 2 | Removed from participant list | [ ] | |
| 4.6 | Non-invited vendor tries to access | Vendor 3 | Access denied (403) | [ ] | |
| 4.7 | Vendor 1 submits bid | Vendor 1 | Bid accepted | [ ] | |
| 4.8 | Buyer awards tender | Buyer | Tender awarded to Vendor 1 | [ ] | |

---

## API Testing

### 41. API Endpoint Validation

#### Test Case: API-001 - Authentication Endpoints
**Priority:** Critical | **User Role:** All

| Endpoint | Method | Test Scenario | Expected Result | Status | Notes |
|----------|--------|---------------|-----------------|--------|-------|
| `/api/auth/register` | POST | Valid registration data | 201 Created, user created | [ ] | |
| `/api/auth/register` | POST | Duplicate email | 409 Conflict | [ ] | |
| `/api/auth/register` | POST | Invalid email format | 400 Bad Request | [ ] | |
| `/api/auth/login` | POST | Valid credentials | 200 OK, JWT token returned | [ ] | |
| `/api/auth/login` | POST | Invalid credentials | 401 Unauthorized | [ ] | |
| `/api/auth/logout` | POST | Valid token | 200 OK, token invalidated | [ ] | |
| `/api/auth/refresh` | POST | Valid refresh token | 200 OK, new token returned | [ ] | |

#### Test Case: API-002 - Tender Endpoints
**Priority:** Critical | **User Role:** Buyer

| Endpoint | Method | Test Scenario | Expected Result | Status | Notes |
|----------|--------|---------------|-----------------|--------|-------|
| `/api/tenders` | GET | List all tenders | 200 OK, paginated list | [ ] | |
| `/api/tenders` | GET | With filters | 200 OK, filtered results | [ ] | |
| `/api/tenders` | POST | Create tender (buyer) | 201 Created | [ ] | |
| `/api/tenders` | POST | Create tender (vendor) | 403 Forbidden | [ ] | |
| `/api/tenders/:id` | GET | Get tender details | 200 OK, tender data | [ ] | |
| `/api/tenders/:id` | PUT | Update own tender | 200 OK | [ ] | |
| `/api/tenders/:id` | PUT | Update other buyer's tender | 403 Forbidden | [ ] | |
| `/api/tenders/:id/publish` | POST | Publish own tender | 200 OK | [ ] | |
| `/api/tenders/:id` | DELETE | Delete draft tender | 200 OK | [ ] | |
| `/api/tenders/:id` | DELETE | Delete published tender | 400 Bad Request | [ ] | |

#### Test Case: API-003 - Bid Endpoints
**Priority:** Critical | **User Role:** Vendor

| Endpoint | Method | Test Scenario | Expected Result | Status | Notes |
|----------|--------|---------------|-----------------|--------|-------|
| `/api/tenders/:id/bids` | GET | List bids (buyer) | 200 OK, all bids | [ ] | |
| `/api/tenders/:id/bids` | GET | List bids (vendor) | 200 OK, own bid only | [ ] | |
| `/api/tenders/:id/bids` | POST | Submit bid (vendor) | 201 Created | [ ] | |
| `/api/tenders/:id/bids` | POST | Submit bid (buyer) | 403 Forbidden | [ ] | |
| `/api/bids/:id` | GET | Get own bid | 200 OK | [ ] | |
| `/api/bids/:id` | GET | Get other vendor's bid | 403 Forbidden | [ ] | |
| `/api/bids/:id/withdraw` | POST | Withdraw before deadline | 200 OK | [ ] | |
| `/api/bids/:id/withdraw` | POST | Withdraw after deadline | 400 Bad Request | [ ] | |

#### Test Case: API-004 - Live Auction Endpoints
**Priority:** High | **User Role:** Vendor

| Endpoint | Method | Test Scenario | Expected Result | Status | Notes |
|----------|--------|---------------|-----------------|--------|-------|
| `/api/live-sessions/:id/bids` | POST | Submit bid during active session | 201 Created, SSE broadcast | [ ] | |
| `/api/live-sessions/:id/bids` | POST | Submit bid below minimum increment | 400 Bad Request | [ ] | |
| `/api/live-sessions/:id/bids` | POST | Submit bid when session ended | 400 Bad Request | [ ] | |
| `/api/live-sessions/:id/status` | GET | Get session status | 200 OK, status data | [ ] | |
| `/api/live-sessions/stream` | SSE | Connect to SSE stream | Real-time updates received | [ ] | |

#### Test Case: API-005 - Rate Limiting
**Priority:** High | **User Role:** All

| Endpoint | Method | Test Scenario | Expected Result | Status | Notes |
|----------|--------|---------------|-----------------|--------|-------|
| `/api/auth/login` | POST | 5 failed attempts in 1 minute | 429 Too Many Requests | [ ] | |
| `/api/tenders` | GET | 100+ requests in 1 minute | 429 Too Many Requests | [ ] | |
| `/api/tenders` | GET | After rate limit, wait 1 minute | 200 OK (limit reset) | [ ] | |

---

## Scheduled Jobs & Automation Testing

### 42. Automated Tasks

#### Test Case: SCHED-001 - Tender Deadline Monitoring
**Priority:** High | **User Role:** System

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1.1 | Create tender with deadline in 5 minutes | Tender saved | [ ] | |
| 1.2 | Wait for deadline to pass | System detects expired tender | [ ] | |
| 1.3 | Verify status change | Tender status changes to "closed" | [ ] | |
| 1.4 | Verify notifications | Bidders notified of closure | [ ] | Check logs |
| 1.5 | Verify bid submission blocked | New bids rejected with 400 error | [ ] | |

#### Test Case: SCHED-002 - Currency Rate Updates
**Priority:** Medium | **User Role:** System

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 2.1 | Check current currency rates | Baseline recorded | [ ] | |
| 2.2 | Wait for scheduled update (daily) | Rates updated from external API | [ ] | |
| 2.3 | Verify rate changes | Rates different from baseline | [ ] | |
| 2.4 | Check update timestamp | "Last updated" shows recent time | [ ] | |
| 2.5 | Verify audit log | Currency update logged | [ ] | |

#### Test Case: SCHED-003 - Automated Reminders
**Priority:** Medium | **User Role:** System

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 3.1 | Create tender with deadline in 24 hours | Tender published | [ ] | |
| 3.2 | Wait for reminder job to run | System sends reminder emails | [ ] | |
| 3.3 | Verify vendor notifications | Vendors with no bids receive reminder | [ ] | Check email logs |
| 3.4 | Create tender with deadline in 1 hour | Tender published | [ ] | |
| 3.5 | Wait for urgent reminder job | Urgent reminder emails sent | [ ] | |

#### Test Case: SCHED-004 - Expired Session Cleanup
**Priority:** Medium | **User Role:** System

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 4.1 | Create live auction session | Session scheduled | [ ] | |
| 4.2 | Let session complete and expire | Session ends, 7 days pass | [ ] | |
| 4.3 | Verify cleanup job runs | Expired sessions archived | [ ] | |
| 4.4 | Check database | Session data moved to archive table | [ ] | |
| 4.5 | Verify performance | Database size optimized | [ ] | |

---

## Email Notification Testing

### 43. Email Delivery Validation

#### Test Case: EMAIL-001 - Registration Emails
**Priority:** High | **User Role:** Anonymous

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1.1 | Register new buyer account | Welcome email sent | [ ] | Check email inbox |
| 1.2 | Verify email content | Contains welcome message, login link | [ ] | |
| 1.3 | Verify email branding | Company logo, correct styling | [ ] | |
| 1.4 | Click login link from email | Redirects to login page | [ ] | |
| 1.5 | Register new vendor account | Welcome email sent | [ ] | |
| 1.6 | Verify vendor-specific content | Vendor onboarding instructions | [ ] | |

#### Test Case: EMAIL-002 - Tender Notification Emails
**Priority:** High | **User Role:** Buyer

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 2.1 | Publish new tender | Email notification sent to all vendors | [ ] | Check email queue |
| 2.2 | Verify email subject | "New Tender Published: [Tender Title]" | [ ] | |
| 2.3 | Verify email content | Tender summary, deadline, link to tender | [ ] | |
| 2.4 | Create addendum | Email notification sent to vendors who acknowledged | [ ] | |
| 2.5 | Verify addendum email | Contains addendum details, document link | [ ] | |
| 2.6 | Award tender | Award notification sent to winning vendor | [ ] | |
| 2.7 | Verify award email | Contains award details, next steps | [ ] | |

#### Test Case: EMAIL-003 - Bid Notification Emails
**Priority:** High | **User Role:** Vendor

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 3.1 | Vendor submits bid | Confirmation email sent to vendor | [ ] | |
| 3.2 | Verify confirmation email | Bid reference number, tender details | [ ] | |
| 3.3 | Vendor withdraws bid | Withdrawal confirmation email sent | [ ] | |
| 3.4 | Buyer asks question | Email notification to buyer | [ ] | |
| 3.5 | Buyer answers question | Email notification to asking vendor | [ ] | |

#### Test Case: EMAIL-004 - Reminder Emails
**Priority:** Medium | **User Role:** System

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 4.1 | Create tender with deadline in 24 hours | Tender published | [ ] | |
| 4.2 | Wait for daily reminder job | Reminder email sent to vendors | [ ] | |
| 4.3 | Verify reminder content | Tender title, deadline, days remaining | [ ] | |
| 4.4 | Create tender with deadline in 1 hour | Tender published | [ ] | |
| 4.5 | Wait for hourly reminder job | Urgent reminder email sent | [ ] | |
| 4.6 | Verify urgent flag | Email marked as high priority | [ ] | |

#### Test Case: EMAIL-005 - Email Error Handling
**Priority:** Medium | **User Role:** System

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 5.1 | Simulate bounced email | Invalid vendor email address | [ ] | |
| 5.2 | Verify bounce handling | Bounced email logged | [ ] | |
| 5.3 | Verify retry mechanism | System retries 3 times | [ ] | Check logs |
| 5.4 | Verify failure notification | Admin notified of email failure | [ ] | |
| 5.5 | Check email queue | Failed emails in dead letter queue | [ ] | |

---

## Cross-Cutting Concerns

### 44. UI/UX Consistency

#### Test Case: UI-001 - Design System Consistency
**Priority:** Medium | **User Role:** All

| Element | Criteria | Status | Notes |
|---------|----------|--------|-------|
| Buttons | All use `chaingpt-btn` classes | [ ] | |
| Primary buttons | Orange color, consistent style | [ ] | |
| Secondary buttons | Grey/outlined style | [ ] | |
| Cards | All use `chaingpt-card` class | [ ] | |
| Forms | Consistent input styles | [ ] | |
| Labels | Required fields marked with asterisk | [ ] | |
| Error messages | Red color, clear text | [ ] | |
| Success messages | Green color, clear text | [ ] | |
| Status badges | Consistent colors (draft=blue, published=green, etc.) | [ ] | |
| Loading states | Spinner or skeleton loaders | [ ] | |

#### Test Case: UI-002 - Responsive Design
**Priority:** High | **User Role:** All

| Screen Size | Pages to Test | Status | Notes |
|-------------|---------------|--------|-------|
| 1920x1080 (Desktop) | All pages | [ ] | |
| 1366x768 (Laptop) | All pages | [ ] | |
| 768x1024 (Tablet) | Dashboard, Tenders, Login | [ ] | |
| 375x667 (Mobile) | Dashboard, Tenders, Login | [ ] | |

**Specific Checks:**
- [ ] Navigation collapses to hamburger on mobile
- [ ] Forms stack vertically on mobile
- [ ] Tables scroll or responsive on mobile
- [ ] Cards resize appropriately
- [ ] No horizontal scrolling on mobile

#### Test Case: UI-003 - Dark Mode (if implemented)
**Priority:** Low | **User Role:** All

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 3.1 | Toggle dark mode | Theme changes | [ ] | |
| 3.2 | Verify all pages | Consistent dark theme | [ ] | |
| 3.3 | Check contrast | Text readable on dark backgrounds | [ ] | |
| 3.4 | Refresh page | Theme preference persisted | [ ] | |

---

### 45. Performance Testing

#### Test Case: PERF-001 - Page Load Times
**Priority:** Medium | **User Role:** All

| Page | Target Load Time | Actual | Status | Notes |
|------|------------------|--------|--------|-------|
| `/login` | < 1s | [ ] | [ ] | |
| `/dashboard` | < 2s | [ ] | [ ] | |
| `/tenders` | < 2s | [ ] | [ ] | |
| `/tenders/new` | < 1.5s | [ ] | [ ] | |
| `/tenders/:id` | < 2s | [ ] | [ ] | |

#### Test Case: PERF-002 - API Response Times
**Priority:** Medium | **User Role:** All

| Endpoint | Target Response | Actual | Status | Notes |
|----------|----------------|--------|--------|-------|
| `GET /tenders` | < 500ms | [ ] | [ ] | |
| `POST /tenders` | < 1s | [ ] | [ ] | |
| `GET /tender-types/ranges` | < 300ms | [ ] | [ ] | CRITICAL (caching) |
| `GET /bids` | < 500ms | [ ] | [ ] | |

#### Test Case: PERF-003 - Large Data Sets
**Priority:** Low | **User Role:** All

| Scenario | Expected Behavior | Status | Notes |
|----------|-------------------|--------|-------|
| 1000+ tenders in list | Pagination works, no lag | [ ] | |
| 100+ bids on tender | List renders efficiently | [ ] | |
| Large file upload (10MB+) | Progress indicator, no timeout | [ ] | |

---

### 46. Data Validation & Security

#### Test Case: SEC-001 - Input Sanitization
**Priority:** Critical | **User Role:** All

| Input Field | Test Value | Expected Result | Status | Notes |
|-------------|------------|-----------------|--------|-------|
| Tender Title | `<script>alert('XSS')</script>` | Escaped/sanitized | [ ] | |
| Tender Description | `<img src=x onerror=alert('XSS')>` | Escaped/sanitized | [ ] | |
| User Name | `'; DROP TABLE users; --` | SQL injection prevented | [ ] | |
| Search Query | `../../../etc/passwd` | Path traversal prevented | [ ] | |

#### Test Case: SEC-002 - Authentication Security
**Priority:** Critical | **User Role:** All

| Test | Expected Behavior | Status | Notes |
|------|-------------------|--------|-------|
| Password stored as plaintext | Passwords hashed (bcrypt/argon2) | [ ] | Check DB |
| JWT token expiry | Token expires after set time | [ ] | |
| Logout clears token | Cannot access with old token | [ ] | |
| CSRF protection | CSRF tokens validated | [ ] | |

#### Test Case: SEC-003 - Authorization Bypass Attempts
**Priority:** Critical | **User Role:** All

| Test | Expected Behavior | Status | Notes |
|------|-------------------|--------|-------|
| Modify tender ID in URL | Cannot access unauthorized tender | [ ] | |
| API request with vendor token to buyer endpoint | 403 Forbidden | [ ] | |
| Escalate privilege via API manipulation | Blocked, logged | [ ] | |

---

### 47. Error Handling

#### Test Case: ERR-001 - Network Errors
**Priority:** High | **User Role:** All

| Scenario | Expected Behavior | Status | Notes |
|----------|-------------------|--------|-------|
| Backend down while loading page | Graceful error message | [ ] | |
| API timeout | Timeout message, retry option | [ ] | |
| Slow network (throttle to 3G) | Loading indicators visible | [ ] | |
| Intermittent connection | Retry mechanism works | [ ] | |

#### Test Case: ERR-002 - Form Error States
**Priority:** High | **User Role:** All

| Scenario | Expected Behavior | Status | Notes |
|----------|-------------------|--------|-------|
| Submit invalid form | Errors displayed inline | [ ] | |
| Multiple field errors | All errors shown simultaneously | [ ] | |
| Correct error, resubmit | Error clears, form submits | [ ] | |

#### Test Case: ERR-003 - 404 & Route Errors
**Priority:** Medium | **User Role:** All

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 3.1 | Navigate to `/non-existent-page` | 404 page displays | [ ] | |
| 3.2 | Try invalid tender ID | "Tender not found" error | [ ] | |
| 3.3 | Click "Go Home" on 404 | Redirected to dashboard or home | [ ] | |

---

### 48. Browser Compatibility

#### Test Case: BROWSER-001 - Feature Compatibility
**Priority:** Medium | **User Role:** All

| Feature | Chrome | Firefox | Safari | Edge | Status |
|---------|--------|---------|--------|------|--------|
| Login/Register | [ ] | [ ] | [ ] | [ ] | [ ] |
| Create Tender | [ ] | [ ] | [ ] | [ ] | [ ] |
| Submit Bid | [ ] | [ ] | [ ] | [ ] | [ ] |
| File Upload | [ ] | [ ] | [ ] | [ ] | [ ] |
| Date/Time Pickers | [ ] | [ ] | [ ] | [ ] | [ ] |
| Dropdowns/Selects | [ ] | [ ] | [ ] | [ ] | [ ] |
| Modal Dialogs | [ ] | [ ] | [ ] | [ ] | [ ] |

---

### 49. Accessibility (WCAG 2.1)

#### Test Case: A11Y-001 - Keyboard Navigation
**Priority:** Medium | **User Role:** All

| Test | Expected Behavior | Status | Notes |
|------|-------------------|--------|-------|
| Tab through forms | All fields reachable via Tab | [ ] | |
| Submit form with Enter | Form submits | [ ] | |
| Dropdowns with arrow keys | Options selectable | [ ] | |
| Modal focus trap | Tab stays within modal | [ ] | |
| Skip links | "Skip to main content" available | [ ] | |

#### Test Case: A11Y-002 - Screen Reader Support
**Priority:** Medium | **User Role:** All

| Element | Expected Behavior | Status | Notes |
|---------|-------------------|--------|-------|
| Form labels | All inputs have labels | [ ] | |
| Button text | Descriptive text/aria-label | [ ] | |
| Error messages | Announced by screen reader | [ ] | |
| Status badges | Role and state announced | [ ] | |
| Images | Alt text present | [ ] | |

#### Test Case: A11Y-003 - Color Contrast
**Priority:** Medium | **User Role:** All

| Element | WCAG AAA Ratio | Status | Notes |
|---------|----------------|--------|-------|
| Body text on background | > 7:1 | [ ] | |
| Button text | > 7:1 | [ ] | |
| Link text | > 7:1 | [ ] | |
| Error messages | > 7:1 | [ ] | |

---

## Test Execution Summary

### Overall Test Metrics

| Category | Total Tests | Passed | Failed | Blocked | Not Run | Pass Rate |
|----------|-------------|--------|--------|---------|---------|-----------|
| Authentication | - | - | - | - | - | - |
| Dashboard | - | - | - | - | - | - |
| Tender Management | - | - | - | - | - | - |
| Bid Management | - | - | - | - | - | - |
| Evaluation | - | - | - | - | - | - |
| Vendor Management | - | - | - | - | - | - |
| Profile Management | - | - | - | - | - | - |
| Document Management | - | - | - | - | - | - |
| Communications | - | - | - | - | - | - |
| Admin Functions | - | - | - | - | - | - |
| RBAC | - | - | - | - | - | - |
| End-to-End Workflows | - | - | - | - | - | - |
| API Testing | - | - | - | - | - | - |
| Scheduled Jobs | - | - | - | - | - | - |
| Email Notifications | - | - | - | - | - | - |
| Cross-Cutting | - | - | - | - | - | - |
| **TOTAL** | **-** | **-** | **-** | **-** | **-** | **-%** |

---

## Critical Issues Log

| Issue ID | Severity | Component | Description | Status | Assigned To | Resolution |
|----------|----------|-----------|-------------|--------|-------------|------------|
| CRIT-001 | Critical | Tender Creation | Page freezes on procurement type selection | Fixed | - | Applied reactive guard fix |
| - | - | - | - | - | - | - |

---

## Test Environment Information

- **Executed By:** [Tester Name]
- **Execution Date:** [Date]
- **Environment:** Development/Staging/Production
- **Backend Version:** [Version/Commit Hash]
- **Frontend Version:** [Version/Commit Hash]
- **Database Version:** [PostgreSQL Version]
- **Browser Versions:**
  - Chrome: [Version]
  - Firefox: [Version]
  - Safari: [Version]
  - Edge: [Version]

---

## Sign-off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| QA Lead | | | |
| Developer | | | |
| Product Owner | | | |
| Project Manager | | | |

---

## Notes & Observations

*Use this section to note any additional findings, edge cases discovered during testing, or recommendations for future improvements.*

---

**End of Manual QA Guide**
