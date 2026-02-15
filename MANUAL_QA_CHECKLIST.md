# Manual QA Testing Checklist: Cascading Tender Dropdowns

**Project:** RFQ Buddy - Bangladesh e-GP Platform  
**Feature:** Cascading Tender Type Selection Dropdowns  
**Date:** February 8, 2026  
**Status:** Ready for Testing  

---

## Test Environment Setup

- [ ] Backend server running on localhost:3333
- [ ] Frontend running on localhost:5173
- [ ] Database populated with tender type definitions
- [ ] Test user accounts created (buyer@test.com, vendor@test.com)
- [ ] Redis cache available

---

## Scenario 1: Goods Procurement Decision Tree

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1.1 | Navigate to /tenders/new | Page loads with form | [ ] | |
| 1.2 | Select "Goods" procurement type | International/Turnkey/Emergency checkboxes appear | [ ] | |
| 1.3 | Select "Up to 8 Lac" cost | PG1 auto-suggested | [ ] | |
| 1.4 | Select "8-50 Lac" cost | PG2 auto-suggested | [ ] | |
| 1.5 | Select "Above 50 Lac" cost | PG3 auto-suggested | [ ] | |
| 1.6 | Check International flag | Changes to PG4 regardless of cost | [ ] | |
| 1.7 | Uncheck International, Check Turnkey | Changes to PG5A | [ ] | |
| 1.8 | Check Emergency flag | Changes to PG9A | [ ] | |
| 1.9 | Uncheck all special flags | Reverts to cost-based (PG1/PG2/PG3) | [ ] | |

---

## Scenario 2: Works Procurement

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 2.1 | Select "Works" procurement type | International/Turnkey checkboxes hidden | [ ] | |
| 2.2 | Select cost ≤ 15 Lac | PW1 suggested | [ ] | |
| 2.3 | Select cost > 5 Crore | PW3 suggested | [ ] | |
| 2.4 | Verify gap (15 Lac - 5 Crore) | Shows appropriate message or option | [ ] | |

---

## Scenario 3: Services Procurement

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 3.1 | Select "Services" procurement type | Outsourcing Personnel checkbox appears | [ ] | |
| 3.2 | Check Outsourcing Personnel | PPS2 suggested | [ ] | |
| 3.3 | Uncheck Outsourcing | PPS3 suggested | [ ] | |
| 3.4 | Check Emergency | PPS6 suggested | [ ] | |

---

## Scenario 4: Edge Cases

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 4.1 | Change procurement type mid-form | Form resets, checkboxes update | [ ] | |
| 4.2 | Try to select cost before procurement type | Cost dropdown disabled | [ ] | |
| 4.3 | Simulate API failure | Graceful error message shown | [ ] | |
| 4.4 | Test on slow network | Loading states visible | [ ] | |
| 4.5 | Rapidly change selections | No race conditions, consistent state | [ ] | |
| 4.6 | Multiple checkboxes checked | Correct priority applied (Emergency > Turnkey > International > Value) | [ ] | |

---

## Scenario 5: UI/UX Validation

| Aspect | Criteria | Status | Notes |
|--------|----------|--------|-------|
| Labels | Clear and descriptive | [ ] | |
| Helper text | Provides adequate guidance | [ ] | |
| Disabled states | Visually obvious | [ ] | |
| Auto-suggestion | User gets feedback about auto-fill | [ ] | |
| Manual override | Obviously allowed and functional | [ ] | |
| Error messages | Clear and actionable | [ ] | |
| Loading states | Shown during API calls | [ ] | |
| Responsive | Works on different screen sizes | [ ] | |

---

## Scenario 6: Data Integrity

| Test | Expected Result | Status | Notes |
|------|----------------|--------|-------|
| All tender types in database | Appear in appropriate dropdowns | [ ] | |
| Value ranges | Non-overlapping and complete | [ ] | |
| Special cases | Correctly mapped per procurement type | [ ] | |
| Submitted tenders | Correct type saved to database | [ ] | |

---

## Scenario 7: Performance Validation

| Metric | Target | Actual | Status | Notes |
|--------|----------|---------|--------|-------|
| API response time (cold) | < 200ms | [ ] | |
| API response time (warm) | < 50ms | [ ] | |
| Dropdown cascade time | < 100ms | [ ] | |
| Page load time | < 2s | [ ] | |

---

## Scenario 8: Cross-Browser Testing

| Browser | Version | Status | Notes |
|---------|----------|--------|-------|
| Chrome | Latest | [ ] | |
| Firefox | Latest | [ ] | |
| Safari | Latest | [ ] | |
| Edge | Latest | [ ] | |

---

## Scenario 9: Mobile Responsiveness

| Device | Viewport | Status | Notes |
|--------|----------|--------|-------|
| iPhone 12 | 390x844 | [ ] | |
| Samsung Galaxy | 360x640 | [ ] | |
| iPad | 768x1024 | [ ] | |
| Desktop | 1920x1080 | [ ] | |

---

## Bug Report Template

| ID | Severity | Component | Description | Steps to Reproduce | Expected | Actual | Status | Assignee |
|----|----------|-----------|-------------|-------------------|----------|--------|----------|
| MQ-001 | Critical | Backend API | 500 error on invalid type | Send GET /ranges?procurementType=invalid | 400 error | 500 error | Open | - |
| MQ-002 | High | Frontend | Dropdown doesn't reset | Change procurement type | Dropdowns reset | Values remain | Open | - |
| MQ-003 | Medium | Frontend | Loading state missing | Select procurement type | Loading spinner | No feedback | Open | - |
| MQ-004 | Low | UI | Label text unclear | Read helper text | Clear guidance | Confusing | Open | - |

---

## Test Execution Log

**Tester:** _________________________  
**Start Time:** _________________________  
**End Time:** _________________________  
**Environment:** _________________________  

### Summary
- **Total Scenarios:** _____
- **Passed:** _____
- **Failed:** _____
- **Blocked:** _____
- **Critical Issues:** _____
- **High Issues:** _____

### Overall Assessment
- [ ] **Ready for Production** - All critical scenarios pass
- [ ] **Ready with Minor Issues** - Non-critical issues found
- [ ] **Not Ready** - Critical issues blocking release

### Recommendations
1. __________________________________________________________
2. __________________________________________________________
3. __________________________________________________________

---

## Sign-off

| Role | Name | Signature | Date |
|------|------|-----------|-------|
| QA Tester | | | |
| Product Owner | | | |
| Tech Lead | | | |

---

**Document Version:** 1.0  
**Last Updated:** February 8, 2026
