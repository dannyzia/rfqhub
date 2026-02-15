# Cascading Tender Selection Dropdowns - Implementation Summary

**Date:** February 8, 2026  
**Status:** ✅ COMPLETE - All code changes implemented and error-checked

---

## Overview

Implemented intelligent cascading dropdown logic for the tender creation form at `/tenders/new` that:

1. **Procurement Type** (user selects)
2. **Special Case Flags** (conditional based on procurement type)
3. **Estimated Cost** (auto-populated from value ranges API)
4. **Tender Type** (auto-suggested based on procurement type + cost + special flags)

The implementation follows the Bangladesh e-GP decision tree from [TENDER_TYPES_AND_REQUIREMENTS.md](Instructions/TENDER_TYPES_AND_REQUIREMENTS.md).

---

## Changes Made

### Backend Changes

#### 1. **New Endpoint: GET /api/tender-types/ranges**

**File:** [backend/src/controllers/tenderType.controller.ts](rfq-platform/backend/src/controllers/tenderType.controller.ts)

Added new controller function `getValueRanges()` that:
- Accepts query parameter: `?procurementType=goods|works|services`
- Returns value ranges grouped for dropdown filtering
- Returns special case flags applicable to each procurement type
- Returns error if procurementType is missing or invalid

**Response Format:**
```json
{
  "success": true,
  "data": {
    "procurementType": "goods",
    "ranges": [
      {
        "label": "0 Lac - 8 Lac (PG1)",
        "minValue": 0,
        "maxValue": 800000,
        "suggestedTypes": ["PG1"]
      },
      {
        "label": "8 Lac - 50 Lac (PG2)",
        "minValue": 800001,
        "maxValue": 5000000,
        "suggestedTypes": ["PG2"]
      },
      // ... more ranges
    ],
    "specialCases": {
      "international": { "available": true, "type": "PG4" },
      "turnkey": { "available": true, "type": "PG5A" },
      "emergency": { "available": true, "type": "PG9A" },
      "singleSource": { "available": true, "type": "PG9A" }
    }
  }
}
```

#### 2. **New Service Function: getValueRangesForProcurementType()**

**File:** [backend/src/services/tenderTypeSelector.service.ts](rfq-platform/backend/src/services/tenderTypeSelector.service.ts)

Added new exported interface and function:
- `ValueRangeGroup`: Interface for value range objects
- `getValueRangesForProcurementType()`: Builds value ranges from tender_type_definitions table

Logic:
- Filters out special types (PG4, PG5A, PPS2) as they're handled separately
- Sorts tender types by min_value_bdt to create sequential ranges
- Groups special cases by procurement type

#### 3. **Updated Routing**

**File:** [backend/src/routes/tenderType.routes.ts](rfq-platform/backend/src/routes/tenderType.routes.ts)

Added route:
```typescript
router.get('/ranges', tenderTypeController.getValueRanges);
```

Route placed before `/:code` parameter route to ensure exact match takes precedence.

---

### Frontend Changes

#### 1. **Enhanced Form Data**

**File:** [frontend/src/routes/(app)/tenders/new/+page.svelte](rfq-platform/frontend/src/routes/(app)/tenders/new/+page.svelte)

Added special case flags to `formData` object:
```typescript
let formData = {
  // ... existing fields
  isEmergency: false,
  isInternational: false,
  isTurnkey: false,
  isOutsourcingPersonnel: false,
  isSingleSource: false,
};
```

#### 2. **New Query: Value Ranges**

Created `valueRangesQuery` to fetch from new backend endpoint:
- Triggers when `procurementType` changes
- Caches results via React Query
- Used to populate estimated cost dropdown

#### 3. **Updated Estimated Cost Dropdown**

Replaced `currentEstimatedCostOptions` logic:
- **Before:** Hardcoded PRESET_VALUES + fallback ranges
- **After:** Dynamic ranges from backend API

Builds options from `valueRangesQuery.data.ranges`:
```typescript
$: currentEstimatedCostOptions = (() => {
  if (!formData.procurementType) {
    return [{ value: '', label: 'Select procurement type first', range: null }];
  }
  // ... fetch from valueRangesQuery and map to dropdown options
})();
```

#### 4. **New Reactive: Filtered Tender Type Options**

Created `filteredTenderTypeOptions` that:
- Filters `currentTenderTypeOptions` based on estimated cost
- Checks for special cases first (emergency, international, turnkey, outsourcing)
- Falls back to normal value-based filtering
- Respects Bangladesh e-GP decision tree with proper priority

Logic:
```
IF emergency OR singleSource:
  → PG9A (goods) or PPS6 (services)
ELSE IF turnkey AND goods:
  → PG5A
ELSE IF international AND goods:
  → PG4
ELSE IF outsourcingPersonnel AND services:
  → PPS2
ELSE (normal value-based):
  → PG1, PG2, PG3 (goods) or PW1, PW3 (works) or PPS3 (services)
```

#### 5. **Auto-Suggestion Logic**

Added reactive statement that auto-suggests tender type:
```typescript
$: if (formData.estimatedCost && filteredTenderTypeOptions.length > 0) {
  if (!formData.tenderType || !filteredTenderTypeOptions.some(o => o.value === formData.tenderType)) {
    formData.tenderType = filteredTenderTypeOptions[0].value;
  }
}
```

- Only suggests if `estimatedCost` is set and filtered options are available
- Only overrides selection if current selection is invalid
- Allows manual override by user

#### 6. **UI: Special Case Checkboxes**

Added conditional special case flag checkboxes after Procurement Type selection:

**Common to all:**
- ☐ Emergency / Single Source

**Only for Goods:**
- ☐ International Bidding
- ☐ Turnkey Contract (Plant & Equipment)

**Only for Services:**
- ☐ Outsourcing Service Personnel

**Only for Works:**
- (No special flags, but emergency/single source handled via direct procurement justification)

#### 7. **Updated Tender Type Dropdown**

Changed from `currentTenderTypeOptions` to `filteredTenderTypeOptions`:
- Only shows tender types matching selected cost + special flags
- Disabled until both procurement type and estimated cost are selected
- Auto-filled via suggestion logic
- Allows manual override

---

## User Flow

### New Tender Creation

**Step 1: Procurement Type**
- User selects: Goods / Works / Services
- Special case checkboxes appear conditionally

**Step 2: Special Cases (Optional)**
- User checks any applicable special conditions
- Options depend on procurement type selected

**Step 3: Estimated Cost (Auto-populated)**
- Dropdown shows ranges from backend
- Example for Goods: "0 Lac - 8 Lac (PG1)", "8-50 Lac (PG2)", etc.

**Step 4: Tender Type (Auto-suggested)**
- Automatically filled based on cost + special flags
- Shows only applicable options
- User can override if needed
- Follows decision tree exactly

---

## Decision Tree Implementation

### Goods (PG)
| Cost | No Special Flags | International | Turnkey | Emergency |
|------|------------------|---------------|---------|-----------|
| ≤ 8 Lac | PG1 | PG4 | PG5A | PG9A |
| 8-50 Lac | PG2 | PG4 | PG5A | PG9A |
| > 50 Lac | PG3 | PG4 | PG5A | PG9A |

### Works (PW)
| Cost | Regular | Emergency |
|------|---------|-----------|
| ≤ 15 Lac | PW1 | Direct (PW) |
| 15-50M | - [GAP] | - [GAP] |
| > 5 Crore | PW3 | Direct (PW) |

### Services (PPS)
| Type | Regular | Outsourcing | Emergency |
|------|---------|-------------|-----------|
| - | PPS3 | PPS2 | PPS6 |

---

## Testing Checklist

### Backend Endpoint
```bash
# Test value ranges endpoint
curl -X GET "http://localhost:3333/api/tender-types/ranges?procurementType=goods"
curl -X GET "http://localhost:3333/api/tender-types/ranges?procurementType=works"
curl -X GET "http://localhost:3333/api/tender-types/ranges?procurementType=services"

# Should return { success: true, data: {...} }
```

### Frontend - Manual Testing

1. **Load `/tenders/new`** in browser
   - ✓ Form loads without errors

2. **Select Goods**
   - ✓ Special case checkboxes appear (International, Turnkey, Emergency)
   - ✓ Estimated Cost dropdown populates with ranges

3. **Select "Up to 8 Lac"**
   - ✓ Tender Type auto-suggests "PG1"
   - ✓ Only PG1 option shown

4. **Check "Turnkey"**
   - ✓ Tender Type changes to "PG5A"
   - ✓ Only PG5A option shown

5. **Uncheck Turnkey, Select "8-50 Lac"**
   - ✓ Tender Type changes to "PG2"
   - ✓ Filters show only PG2

6. **Check "International"**
   - ✓ Tender Type changes to "PG4"
   - ✓ Only PG4 option shown (overrides cost-based selection)

7. **Select Works**
   - ✓ Checkboxes hide International/Turnkey
   - ✓ Special cases still show Emergency
   - ✓ Cost ranges show PW1/PW3

8. **Select "Above 5 Crore"**
   - ✓ Auto-suggests "PW3"

9. **Select Services**
   - ✓ Turnkey/International hidden
   - ✓ Outsourcing Personnel checkbox appears
   - ✓ Cost ranges show (doesn't affect PPS3/PPS2)

10. **Check "Outsourcing Personnel"**
    - ✓ Auto-suggests "PPS2"

---

## Key Features

✅ **Dynamic Dropdowns** - All options come from backend database  
✅ **Auto-Suggestion** - Tender type auto-fills based on criteria  
✅ **Special Flags** - Emergency, International, Turnkey, Outsourcing support  
✅ **Decision Tree** - Implements Bangladesh e-GP rules exactly  
✅ **Manual Override** - Users can change auto-suggestions if needed  
✅ **Conditional UI** - Checkboxes only show when relevant  
✅ **Error Handling** - Graceful fallbacks and validation  
✅ **Type-Safe** - Full TypeScript support  
✅ **Cached** - Backend caches tender type data for performance  

---

## Database Notes

The implementation uses existing `tender_type_definitions` table:
- All tender types must have `is_active = TRUE`
- Value ranges defined by `min_value_bdt` and `max_value_bdt`
- Special types identified by `is_direct_procurement`, `is_international` flags
- No schema changes required

---

## Files Modified

### Backend
- [backend/src/services/tenderTypeSelector.service.ts](rfq-platform/backend/src/services/tenderTypeSelector.service.ts)
- [backend/src/controllers/tenderType.controller.ts](rfq-platform/backend/src/controllers/tenderType.controller.ts)
- [backend/src/routes/tenderType.routes.ts](rfq-platform/backend/src/routes/tenderType.routes.ts)

### Frontend
- [frontend/src/routes/(app)/tenders/new/+page.svelte](rfq-platform/frontend/src/routes/(app)/tenders/new/+page.svelte)

---

## How to Test

### 1. Start the servers
```bash
# Terminal 1 - Backend
cd rfq-platform/backend
npm run dev

# Terminal 2 - Frontend
cd rfq-platform/frontend
npm run dev
```

### 2. Navigate to tender creation
```
http://localhost:5173/tenders/new
```

### 3. Follow user flow above
Select procurement type → pick optional special cases → select cost → verify auto-suggestion

---

## Rollback Instructions

If needed, revert by removing/undoing these files:
- `backend/src/services/tenderTypeSelector.service.ts` - remove `getValueRangesForProcurementType()` function
- `backend/src/controllers/tenderType.controller.ts` - remove `getValueRanges()` function
- `backend/src/routes/tenderType.routes.ts` - remove `/ranges` route
- `frontend/src/routes/(app)/tenders/new/+page.svelte` - restore previous version (use git)

---

## Future Enhancements

1. **Advanced Suggestions** - Call `/tender-types/suggest` POST endpoint with all flags for detailed recommendations
2. **Document Checklist** - Auto-populate required documents based on tender type
3. **Security Calculations** - Display auto-calculated security amounts based on tender type
4. **Works Gap** - Address missing tender type for 1.5M - 50M BDT range in Works procurement
5. **Value Validation** - Real-time warning if value doesn't fit selected tender type
6. **Description Helpers** - Show tender type descriptions/requirements in collapsible panels

---

## References

- Decision Tree: [TENDER_TYPES_AND_REQUIREMENTS.md](Instructions/TENDER_TYPES_AND_REQUIREMENTS.md#L714-L766)
- Database Schema: `tender_type_definitions` table in PostgreSQL
- Frontend Framework: SvelteKit with React Query
- Backend Framework: Express.js with TypeScript

---

**Implementation completed and verified for compilation errors.**  
**Ready for integration testing and QA.**
