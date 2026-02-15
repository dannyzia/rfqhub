# QA & Integration Testing Plan: Cascading Tender Dropdowns

**Project:** RFQ Buddy - Bangladesh e-GP Platform  
**Feature:** Cascading Tender Type Selection Dropdowns  
**Created:** February 8, 2026  
**Status:** Backend Complete; Frontend Component Tests Partial  
**Last Updated:** February 8, 2026  

### Current Test Results (Feb 8, 2026)
- **Phase 1 – Backend Unit:** ✅ 35/35 Passed (tenderTypeSelector.service.test.ts)
- **Phase 2 – Backend Integration:** ✅ 17/17 Passed (tenderTypeRanges.api.test.ts) — auth middleware fixed to use `roles`/`organization_id`
- **Phase 3 – Frontend Component:** ⚠️ 9/15 Passed; 6 fail (mock/selector alignment)
- **Phase 4 – E2E:** Not run (requires app + API running)
- **Full Results:** See [QA_TEST_RESULTS.md](QA_TEST_RESULTS.md)  

---

## Table of Contents

1. [Overview](#overview)
2. [Testing Infrastructure](#testing-infrastructure)
3. [Phase 1: Backend Unit Tests](#phase-1-backend-unit-tests)
4. [Phase 2: Backend Integration Tests](#phase-2-backend-integration-tests)
5. [Phase 3: Frontend Component Tests](#phase-3-frontend-component-tests)
6. [Phase 4: End-to-End Tests](#phase-4-end-to-end-tests)
7. [Phase 5: Manual QA Testing](#phase-5-manual-qa-testing)
8. [Phase 6: Performance & Load Testing](#phase-6-performance--load-testing)
9. [Phase 7: Regression Testing](#phase-7-regression-testing)
10. [Test Execution Schedule](#test-execution-schedule)
11. [Success Criteria](#success-criteria)

---

## Overview

This document outlines the comprehensive testing strategy for the cascading tender type selection feature implemented in the RFQ Buddy platform. The feature implements intelligent dropdown cascading based on Bangladesh e-GP procurement rules.

### Feature Scope

- **Backend:** New `/api/tender-types/ranges` endpoint
- **Frontend:** Cascading dropdowns with auto-suggestion
- **Business Logic:** Special case handling (International, Turnkey, Emergency, Outsourcing)
- **User Experience:** Auto-suggestion with manual override capability

### Testing Objectives

1. ✅ Verify backend API correctly returns value ranges
2. ✅ Verify special case flags work as expected
3. ✅ Verify frontend dropdowns cascade properly
4. ✅ Verify auto-suggestion follows decision tree
5. ✅ Verify manual override capability
6. ✅ Ensure no regressions in existing functionality
7. ✅ Validate performance benchmarks
8. ✅ Ensure production readiness

---

## Testing Infrastructure

### Current Test Stack

**Backend:**
- **Jest** (v29.7.0) - Main test runner
- **ts-jest** - TypeScript support
- **Supertest** (v6.3.3) - HTTP API testing
- **Config:** `rfq-platform/backend/jest.config.js`

**Frontend:**
- **Vitest** (v4.0.18) - Unit/integration tests
- **Playwright** (v1.58.1) - E2E testing
- **@testing-library/svelte** (v5.3.1) - Component testing
- **jsdom** (v27.4.0) - DOM simulation
- **Config:** `rfq-platform/frontend/vitest.config.ts` & `playwright.config.ts`

### Test Commands

```bash
# Backend
cd rfq-platform/backend
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage

# Frontend
cd rfq-platform/frontend
npm test                    # Unit tests (Vitest)
npm run test:e2e            # E2E tests (Playwright)
npm run test:e2e:ui         # E2E with UI
npm run coverage            # With coverage
```

### Test User Credentials

For integration and E2E tests, the following test user is automatically created during test execution:

**Test User (Buyer):**
- Email: `buyer@test.com`
- Password: `Test@1234`
- Role: `buyer`
- Company: `Test Company`

**How it Works:**
- Test files automatically register this user in the `beforeAll` hook
- If the user already exists from a previous test run, the tests will attempt to login instead
- The user is automatically deleted in the `afterAll` hook for cleanup
- Token field in auth responses: `accessToken` (not `token`)

**Example Usage in Tests:**
```typescript
beforeAll(async () => {
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'buyer@test.com',
      password: 'Test@1234',
      firstName: 'Test',
      lastName: 'Buyer',
      role: 'buyer',
      companyName: 'Test Company'
    });

  authToken = registerRes.body?.data?.accessToken;

  // Fallback to login if registration fails
  if (!authToken) {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'buyer@test.com', password: 'Test@1234' });
    authToken = loginRes.body?.data?.accessToken;
  }
});
```

---

## Phase 1: Backend Unit Tests

### 1.1 Service Function Tests

**File to create:** `rfq-platform/backend/src/services/__tests__/tenderTypeSelector.service.test.ts`

Add tests for the new `getValueRangesForProcurementType()` function:

```typescript
import * as tenderTypeService from '../tenderTypeSelector.service';

describe('getValueRangesForProcurementType', () => {
  // Basic functionality
  test('should return value ranges for goods procurement', async () => {
    const result = await tenderTypeService.getValueRangesForProcurementType('goods');
    
    expect(result.procurementType).toBe('goods');
    expect(result.ranges.length).toBeGreaterThan(0);
    expect(result.ranges[0]).toHaveProperty('label');
    expect(result.ranges[0]).toHaveProperty('minValue');
    expect(result.ranges[0]).toHaveProperty('maxValue');
    expect(result.ranges[0]).toHaveProperty('suggestedTypes');
  });

  test('should return correct special cases for goods', async () => {
    const result = await tenderTypeService.getValueRangesForProcurementType('goods');
    
    expect(result.specialCases).toHaveProperty('international');
    expect(result.specialCases.international.available).toBe(true);
    expect(result.specialCases.international.type).toBe('PG4');
    expect(result.specialCases).toHaveProperty('turnkey');
    expect(result.specialCases.turnkey.type).toBe('PG5A');
    expect(result.specialCases).toHaveProperty('emergency');
    expect(result.specialCases.emergency.type).toBe('PG9A');
  });

  test('should return value ranges for works procurement', async () => {
    const result = await tenderTypeService.getValueRangesForProcurementType('works');
    
    expect(result.procurementType).toBe('works');
    expect(result.ranges).toContainEqual(
      expect.objectContaining({ suggestedTypes: ['PW1'] })
    );
    expect(result.ranges).toContainEqual(
      expect.objectContaining({ suggestedTypes: ['PW3'] })
    );
  });

  test('should return correct special cases for services', async () => {
    const result = await tenderTypeService.getValueRangesForProcurementType('services');
    
    expect(result.specialCases).toHaveProperty('outsourcingPersonnel');
    expect(result.specialCases.outsourcingPersonnel.type).toBe('PPS2');
    expect(result.specialCases).not.toHaveProperty('international');
    expect(result.specialCases).not.toHaveProperty('turnkey');
  });

  test('should not include special types in normal ranges', async () => {
    const result = await tenderTypeService.getValueRangesForProcurementType('goods');
    
    const allSuggestedTypes = result.ranges.flatMap(r => r.suggestedTypes);
    expect(allSuggestedTypes).not.toContain('PG4');
    expect(allSuggestedTypes).not.toContain('PG5A');
    expect(allSuggestedTypes).not.toContain('PG9A');
  });

  test('should return ranges sorted by minValue', async () => {
    const result = await tenderTypeService.getValueRangesForProcurementType('goods');
    
    for (let i = 1; i < result.ranges.length; i++) {
      expect(result.ranges[i].minValue).toBeGreaterThan(
        result.ranges[i - 1].minValue
      );
    }
  });

  test('should format human-readable labels', async () => {
    const result = await tenderTypeService.getValueRangesForProcurementType('goods');
    
    // Should contain Lac/Crore formatting
    expect(result.ranges.some(r => r.label.includes('Lac') || r.label.includes('Crore'))).toBe(true);
  });

  test('should include tender type code in label', async () => {
    const result = await tenderTypeService.getValueRangesForProcurementType('goods');
    
    result.ranges.forEach(range => {
      range.suggestedTypes.forEach(type => {
        expect(range.label).toContain(type);
      });
    });
  });
});
```

**Run command:**
```bash
cd rfq-platform/backend
npm test -- tenderTypeSelector.service.test.ts
```

**Expected Results:**
- ✅ All tests pass
- ✅ Coverage > 95% for `getValueRangesForProcurementType()`
- ✅ No console errors

---

## Phase 2: Backend Integration Tests

### 2.1 API Endpoint Tests

**File to create:** `rfq-platform/backend/src/tests/integration/tenderTypeRanges.api.test.ts`

```typescript
import request from 'supertest';
import app from '../../app';

describe('GET /api/tender-types/ranges', () => {
  let authToken: string;

  beforeAll(async () => {
    // Login to get auth token (follow pattern from existing tests)
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'buyer@test.com', password: 'Test@1234' });
    authToken = loginRes.body.data.token;
  });

  describe('Success Cases', () => {
    test('should return 200 with valid procurement type', async () => {
      const response = await request(app)
        .get('/api/tender-types/ranges?procurementType=goods')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('procurementType');
      expect(response.body.data).toHaveProperty('ranges');
      expect(response.body.data).toHaveProperty('specialCases');
    });

    test('should return ranges for goods', async () => {
      const response = await request(app)
        .get('/api/tender-types/ranges?procurementType=goods')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const { ranges } = response.body.data;
      expect(ranges.length).toBeGreaterThanOrEqual(3);
      expect(ranges[0]).toHaveProperty('label');
      expect(ranges[0]).toHaveProperty('minValue');
      expect(ranges[0]).toHaveProperty('maxValue');
      expect(ranges[0]).toHaveProperty('suggestedTypes');
    });

    test('should return ranges for works', async () => {
      const response = await request(app)
        .get('/api/tender-types/ranges?procurementType=works')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const { ranges } = response.body.data;
      expect(ranges.some(r => r.suggestedTypes.includes('PW1'))).toBe(true);
      expect(ranges.some(r => r.suggestedTypes.includes('PW3'))).toBe(true);
    });

    test('should return ranges for services', async () => {
      const response = await request(app)
        .get('/api/tender-types/ranges?procurementType=services')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const { specialCases } = response.body.data;
      expect(specialCases.outsourcingPersonnel).toBeDefined();
      expect(specialCases.outsourcingPersonnel.type).toBe('PPS2');
    });

    test('should include special cases for goods', async () => {
      const response = await request(app)
        .get('/api/tender-types/ranges?procurementType=goods')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const { specialCases } = response.body.data;
      expect(specialCases.international).toBeDefined();
      expect(specialCases.international.available).toBe(true);
      expect(specialCases.international.type).toBe('PG4');
      expect(specialCases.turnkey).toBeDefined();
      expect(specialCases.turnkey.type).toBe('PG5A');
      expect(specialCases.emergency).toBeDefined();
      expect(specialCases.emergency.type).toBe('PG9A');
    });

    test('should not include international for works', async () => {
      const response = await request(app)
        .get('/api/tender-types/ranges?procurementType=works')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const { specialCases } = response.body.data;
      expect(specialCases.international).toBeUndefined();
      expect(specialCases.turnkey).toBeUndefined();
    });

    test('should not include turnkey for services', async () => {
      const response = await request(app)
        .get('/api/tender-types/ranges?procurementType=services')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const { specialCases } = response.body.data;
      expect(specialCases.international).toBeUndefined();
      expect(specialCases.turnkey).toBeUndefined();
    });
  });

  describe('Error Cases', () => {
    test('should return 400 without procurementType', async () => {
      const response = await request(app)
        .get('/api/tender-types/ranges')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('procurementType');
    });

    test('should return 400 with invalid procurementType', async () => {
      const response = await request(app)
        .get('/api/tender-types/ranges?procurementType=invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/goods|works|services/);
    });

    test('should return 400 with empty procurementType', async () => {
      const response = await request(app)
        .get('/api/tender-types/ranges?procurementType=')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should return 401 without auth token', async () => {
      await request(app)
        .get('/api/tender-types/ranges?procurementType=goods')
        .expect(401);
    });

    test('should return 401 with invalid auth token', async () => {
      await request(app)
        .get('/api/tender-types/ranges?procurementType=goods')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Performance', () => {
    test('should respond within 500ms', async () => {
      const start = Date.now();
      await request(app)
        .get('/api/tender-types/ranges?procurementType=goods')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });

    test('should benefit from caching on second call', async () => {
      // First call - prime cache
      await request(app)
        .get('/api/tender-types/ranges?procurementType=goods')
        .set('Authorization', `Bearer ${authToken}`);

      // Second call - should be faster due to cache
      const start = Date.now();
      await request(app)
        .get('/api/tender-types/ranges?procurementType=goods')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // Should be much faster
    });

    test('should handle multiple concurrent requests', async () => {
      const promises = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/tender-types/ranges?procurementType=goods')
          .set('Authorization', `Bearer ${authToken}`)
      );
      
      const results = await Promise.all(promises);
      results.forEach(res => {
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });
  });

  describe('Data Integrity', () => {
    test('should return consistent results across calls', async () => {
      const response1 = await request(app)
        .get('/api/tender-types/ranges?procurementType=goods')
        .set('Authorization', `Bearer ${authToken}`);

      const response2 = await request(app)
        .get('/api/tender-types/ranges?procurementType=goods')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response1.body.data).toEqual(response2.body.data);
    });

    test('should maintain referential integrity with tender_type_definitions', async () => {
      const response = await request(app)
        .get('/api/tender-types/ranges?procurementType=goods')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify all suggested types exist
      const allTypes = response.body.data.ranges.flatMap(r => r.suggestedTypes);
      const uniqueTypes = [...new Set(allTypes)];

      for (const typeCode of uniqueTypes) {
        const typeResponse = await request(app)
          .get(`/api/tender-types/${typeCode}`)
          .set('Authorization', `Bearer ${authToken}`);
        expect(typeResponse.status).toBe(200);
      }
    });
  });
});
```

**Run command:**
```bash
cd rfq-platform/backend
npm test -- tenderTypeRanges.api.test.ts
```

**Expected Results:**
- ✅ All tests pass
- ✅ API responds correctly to all scenarios
- ✅ Error handling works properly
- ✅ Performance benchmarks met
- ✅ Coverage 100% for controller function

---

## Phase 3: Frontend Component Tests

### 3.1 Tender Creation Form Tests

**File to create:** `rfq-platform/frontend/src/routes/(app)/tenders/new/+page.test.ts`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
import TenderNewPage from './+page.svelte';
import { api } from '$lib/utils/api';
import { isBuyer } from '$lib/stores/auth';

// Mock API
vi.mock('$lib/utils/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

// Mock auth store
vi.mock('$lib/stores/auth', () => ({
  isBuyer: { subscribe: vi.fn((fn) => fn(true)) }
}));

// Mock navigation
vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}));

describe('Tender Creation Form - Cascading Dropdowns', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    vi.clearAllMocks();
  });

  describe('Procurement Type Selection', () => {
    test('should show special case checkboxes when goods selected', async () => {
      render(TenderNewPage, {
        context: new Map([['$$_queryClient', queryClient]])
      });

      const procurementSelect = screen.getByLabelText(/procurement type/i);
      await fireEvent.change(procurementSelect, { target: { value: 'goods' } });

      await waitFor(() => {
        expect(screen.getByText(/international bidding/i)).toBeInTheDocument();
        expect(screen.getByText(/turnkey contract/i)).toBeInTheDocument();
        expect(screen.getByText(/emergency/i)).toBeInTheDocument();
      });
    });

    test('should show outsourcing checkbox for services', async () => {
      render(TenderNewPage, {
        context: new Map([['$$_queryClient', queryClient]])
      });

      const procurementSelect = screen.getByLabelText(/procurement type/i);
      await fireEvent.change(procurementSelect, { target: { value: 'services' } });

      await waitFor(() => {
        expect(screen.getByText(/outsourcing service personnel/i)).toBeInTheDocument();
        expect(screen.queryByText(/international bidding/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/turnkey contract/i)).not.toBeInTheDocument();
      });
    });

    test('should hide special checkboxes for works', async () => {
      render(TenderNewPage, {
        context: new Map([['$$_queryClient', queryClient]])
      });

      const procurementSelect = screen.getByLabelText(/procurement type/i);
      await fireEvent.change(procurementSelect, { target: { value: 'works' } });

      await waitFor(() => {
        expect(screen.queryByText(/international bidding/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/turnkey contract/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/outsourcing/i)).not.toBeInTheDocument();
      });
    });

    test('should reset form when procurement type changes', async () => {
      render(TenderNewPage, {
        context: new Map([['$$_queryClient', queryClient]])
      });

      const procurementSelect = screen.getByLabelText(/procurement type/i);
      
      // Select goods first
      await fireEvent.change(procurementSelect, { target: { value: 'goods' } });
      
      // Change to services
      await fireEvent.change(procurementSelect, { target: { value: 'services' } });

      // Verify goods-specific checkboxes are gone
      await waitFor(() => {
        expect(screen.queryByText(/international bidding/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Estimated Cost Dropdown', () => {
    test('should populate cost options from API', async () => {
      const mockRanges = {
        procurementType: 'goods',
        ranges: [
          { label: '0 - 8 Lac (PG1)', minValue: 0, maxValue: 800000, suggestedTypes: ['PG1'] },
          { label: '8 - 50 Lac (PG2)', minValue: 800001, maxValue: 5000000, suggestedTypes: ['PG2'] }
        ],
        specialCases: {}
      };

      vi.mocked(api.get).mockResolvedValueOnce(mockRanges);

      render(TenderNewPage, {
        context: new Map([['$$_queryClient', queryClient]])
      });

      const procurementSelect = screen.getByLabelText(/procurement type/i);
      await fireEvent.change(procurementSelect, { target: { value: 'goods' } });

      await waitFor(() => {
        expect(screen.getByText(/0 - 8 Lac/i)).toBeInTheDocument();
        expect(screen.getByText(/8 - 50 Lac/i)).toBeInTheDocument();
      });
    });

    test('should be disabled until procurement type selected', () => {
      render(TenderNewPage, {
        context: new Map([['$$_queryClient', queryClient]])
      });

      const costSelect = screen.getByLabelText(/estimated cost/i);
      expect(costSelect).toBeDisabled();
    });

    test('should enable after procurement type selected', async () => {
      const mockRanges = {
        procurementType: 'goods',
        ranges: [{ label: '0 - 8 Lac', minValue: 0, maxValue: 800000, suggestedTypes: ['PG1'] }],
        specialCases: {}
      };

      vi.mocked(api.get).mockResolvedValueOnce(mockRanges);

      render(TenderNewPage, {
        context: new Map([['$$_queryClient', queryClient]])
      });

      const procurementSelect = screen.getByLabelText(/procurement type/i);
      await fireEvent.change(procurementSelect, { target: { value: 'goods' } });

      const costSelect = screen.getByLabelText(/estimated cost/i);
      
      await waitFor(() => {
        expect(costSelect).not.toBeDisabled();
      });
    });

    test('should show loading state', async () => {
      vi.mocked(api.get).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(TenderNewPage, {
        context: new Map([['$$_queryClient', queryClient]])
      });

      const procurementSelect = screen.getByLabelText(/procurement type/i);
      await fireEvent.change(procurementSelect, { target: { value: 'goods' } });

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Tender Type Auto-Suggestion', () => {
    test('should auto-suggest PG1 for goods under 8 Lac', async () => {
      const mockRanges = {
        ranges: [{ label: '0 - 8 Lac', minValue: 0, maxValue: 800000 }],
        specialCases: {}
      };
      const mockTenderTypes = [
        { code: 'PG1', name: 'RFQ - Goods', min_value_bdt: 0, max_value_bdt: 800000 }
      ];

      vi.mocked(api.get)
        .mockResolvedValueOnce(mockRanges)
        .mockResolvedValueOnce(mockTenderTypes);

      render(TenderNewPage, {
        context: new Map([['$$_queryClient', queryClient]])
      });

      const procurementSelect = screen.getByLabelText(/procurement type/i);
      await fireEvent.change(procurementSelect, { target: { value: 'goods' } });

      await waitFor(() => {
        const costSelect = screen.getByLabelText(/estimated cost/i);
        fireEvent.change(costSelect, { target: { value: '0' } });
      });

      await waitFor(() => {
        const typeSelect = screen.getByLabelText(/tender type/i);
        expect(typeSelect).toHaveValue('PG1');
      });
    });

    test('should override with PG4 when international checked', async () => {
      const mockTenderTypes = [
        { code: 'PG1', name: 'RFQ', min_value_bdt: 0, max_value_bdt: 800000 },
        { code: 'PG4', name: 'International', min_value_bdt: 0, max_value_bdt: null }
      ];

      vi.mocked(api.get).mockResolvedValue(mockTenderTypes);

      render(TenderNewPage, {
        context: new Map([['$$_queryClient', queryClient]])
      });

      // Select goods
      const procurementSelect = screen.getByLabelText(/procurement type/i);
      await fireEvent.change(procurementSelect, { target: { value: 'goods' } });

      // Check international
      const internationalCheckbox = screen.getByText(/international bidding/i).previousElementSibling;
      await fireEvent.click(internationalCheckbox);

      // Select cost
      const costSelect = screen.getByLabelText(/estimated cost/i);
      await fireEvent.change(costSelect, { target: { value: '500000' } });

      await waitFor(() => {
        const typeSelect = screen.getByLabelText(/tender type/i);
        expect(typeSelect).toHaveValue('PG4');
      });
    });

    test('should suggest PPS2 when outsourcing personnel checked', async () => {
      const mockTenderTypes = [
        { code: 'PPS2', name: 'Outsourcing', min_value_bdt: 0, max_value_bdt: null },
        { code: 'PPS3', name: 'Services', min_value_bdt: 0, max_value_bdt: null }
      ];

      vi.mocked(api.get).mockResolvedValue(mockTenderTypes);

      render(TenderNewPage, {
        context: new Map([['$$_queryClient', queryClient]])
      });

      const procurementSelect = screen.getByLabelText(/procurement type/i);
      await fireEvent.change(procurementSelect, { target: { value: 'services' } });

      const outsourcingCheckbox = screen.getByText(/outsourcing/i).previousElementSibling;
      await fireEvent.click(outsourcingCheckbox);

      await waitFor(() => {
        const typeSelect = screen.getByLabelText(/tender type/i);
        expect(typeSelect).toHaveValue('PPS2');
      });
    });
  });

  describe('Tender Type Filtering', () => {
    test('should only show tender types matching selected cost', async () => {
      const mockTenderTypes = [
        { code: 'PG1', name: 'RFQ', min_value_bdt: 0, max_value_bdt: 800000 },
        { code: 'PG2', name: 'Limited', min_value_bdt: 800001, max_value_bdt: 5000000 },
        { code: 'PG3', name: 'Open', min_value_bdt: 5000001, max_value_bdt: null }
      ];

      vi.mocked(api.get).mockResolvedValue(mockTenderTypes);

      render(TenderNewPage, {
        context: new Map([['$$_queryClient', queryClient]])
      });

      const procurementSelect = screen.getByLabelText(/procurement type/i);
      await fireEvent.change(procurementSelect, { target: { value: 'goods' } });

      const costSelect = screen.getByLabelText(/estimated cost/i);
      await fireEvent.change(costSelect, { target: { value: '1000000' } }); // 10 Lac

      await waitFor(() => {
        const typeSelect = screen.getByLabelText(/tender type/i);
        const options = Array.from(typeSelect.querySelectorAll('option'));
        const optionValues = options.map(o => o.value).filter(v => v);
        
        expect(optionValues).toContain('PG2');
        expect(optionValues).not.toContain('PG1');
        expect(optionValues).not.toContain('PG3');
      });
    });

    test('should filter correctly for multiple ranges', async () => {
      const mockTenderTypes = [
        { code: 'PG1', name: 'RFQ', min_value_bdt: 0, max_value_bdt: 800000 },
        { code: 'PG2', name: 'Limited', min_value_bdt: 800001, max_value_bdt: 5000000 },
      ];

      vi.mocked(api.get).mockResolvedValue(mockTenderTypes);

      render(TenderNewPage, {
        context: new Map([['$$_queryClient', queryClient]])
      });

      const procurementSelect = screen.getByLabelText(/procurement type/i);
      await fireEvent.change(procurementSelect, { target: { value: 'goods' } });

      // Test PG1 range
      const costSelect = screen.getByLabelText(/estimated cost/i);
      await fireEvent.change(costSelect, { target: { value: '500000' } });

      await waitFor(() => {
        const typeSelect = screen.getByLabelText(/tender type/i);
        expect(typeSelect).toHaveValue('PG1');
      });

      // Change to PG2 range
      await fireEvent.change(costSelect, { target: { value: '2000000' } });

      await waitFor(() => {
        const typeSelect = screen.getByLabelText(/tender type/i);
        expect(typeSelect).toHaveValue('PG2');
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle API error gracefully', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('API Error'));

      render(TenderNewPage, {
        context: new Map([['$$_queryClient', queryClient]])
      });

      const procurementSelect = screen.getByLabelText(/procurement type/i);
      await fireEvent.change(procurementSelect, { target: { value: 'goods' } });

      // Should still render, just without data
      await waitFor(() => {
        const costSelect = screen.getByLabelText(/estimated cost/i);
        expect(costSelect).toBeInTheDocument();
      });
    });

    test('should display error message on form submission failure', async () => {
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Submission failed'));

      render(TenderNewPage, {
        context: new Map([['$$_queryClient', queryClient]])
      });

      // Fill form and submit
      await fireEvent.submit(screen.getByRole('form'));

      await waitFor(() => {
        expect(screen.getByText(/failed/i)).toBeInTheDocument();
      });
    });
  });
});
```

**Run command:**
```bash
cd rfq-platform/frontend
npm test -- +page.test.ts
```

**Expected Results:**
- ✅ All component tests pass
- ✅ Coverage > 85% for component logic
- ✅ All edge cases handled

---

## Phase 4: End-to-End Tests

### 4.1 Complete Tender Creation Flow

**File to create:** `rfq-platform/frontend/e2e/tender-creation-cascade.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Tender Creation - Cascading Dropdowns', () => {
  test.beforeEach(async ({ page }) => {
    // Login as buyer
    await page.goto('/login');
    await page.fill('input[type="email"]', 'buyer@test.com');
    await page.fill('input[type="password"]', 'Test@1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Navigate to tender creation
    await page.goto('/tenders/new');
    await expect(page.locator('h1')).toContainText('Create New Tender');
  });

  test('should cascade from Goods → Cost → Auto-suggest PG1', async ({ page }) => {
    // Step 1: Fill title
    await page.fill('input#title', 'Test Procurement of Office Supplies');

    // Step 2: Select Goods
    await page.selectOption('select#procurementType', 'goods');

    // Step 3: Verify special checkboxes appear
    await expect(page.locator('text=International Bidding')).toBeVisible();
    await expect(page.locator('text=Turnkey Contract')).toBeVisible();

    // Step 4: Select cost range (Up to 8 Lac)
    await page.waitForSelector('select#estimatedCost option:not([value=""])', { 
      state: 'attached' 
    });
    
    const costOptions = await page.locator('select#estimatedCost option').allTextContents();
    const pg1Option = costOptions.find(text => text.includes('8 Lac') && text.includes('PG1'));
    expect(pg1Option).toBeDefined();
    
    // Select the first non-empty option (should be PG1 range)
    await page.selectOption('select#estimatedCost', { index: 1 });

    // Step 5: Verify tender type auto-suggests PG1
    await page.waitForTimeout(500); // Wait for auto-suggestion
    const tenderType = await page.inputValue('select#tenderType');
    expect(tenderType).toBe('PG1');

    // Step 6: Verify only PG1 shown in dropdown
    const typeOptions = await page.locator('select#tenderType option[value!=""]').count();
    expect(typeOptions).toBe(1);
  });

  test('should override to PG4 when International checked', async ({ page }) => {
    await page.fill('input#title', 'International Equipment Purchase');
    await page.selectOption('select#procurementType', 'goods');

    // Check International Bidding
    await page.check('text=International Bidding >> .. >> input[type="checkbox"]');

    // Select cost
    await page.waitForSelector('select#estimatedCost option:not([value=""])', {
      state: 'attached'
    });
    await page.selectOption('select#estimatedCost', { index: 1 });

    // Verify PG4 auto-suggested
    await page.waitForTimeout(500);
    const tenderType = await page.inputValue('select#tenderType');
    expect(tenderType).toBe('PG4');
  });

  test('should suggest PG5A for Turnkey contract', async ({ page }) => {
    await page.fill('input#title', 'Factory Equipment Installation');
    await page.selectOption('select#procurementType', 'goods');

    // Check Turnkey
    await page.check('text=Turnkey Contract >> .. >> input[type="checkbox"]');

    // Select cost
    await page.waitForSelector('select#estimatedCost option:not([value=""])', {
      state: 'attached'
    });
    await page.selectOption('select#estimatedCost', { index: 2 });

    // Verify PG5A
    await page.waitForTimeout(500);
    const tenderType = await page.inputValue('select#tenderType');
    expect(tenderType).toBe('PG5A');
  });

  test('should handle Works procurement properly', async ({ page }) => {
    await page.fill('input#title', 'Road Construction Project');
    await page.selectOption('select#procurementType', 'works');

    // Verify special checkboxes NOT shown (except emergency)
    await expect(page.locator('text=International Bidding')).not.toBeVisible();
    await expect(page.locator('text=Turnkey Contract')).not.toBeVisible();

    // Select cost for PW1 range (under 15 Lac)
    await page.waitForSelector('select#estimatedCost option:not([value=""])', {
      state: 'attached'
    });
    await page.selectOption('select#estimatedCost', { index: 1 });

    // Verify PW1 suggested
    await page.waitForTimeout(500);
    const tenderType = await page.inputValue('select#tenderType');
    expect(tenderType).toBe('PW1');
  });

  test('should suggest PPS2 for outsourcing personnel', async ({ page }) => {
    await page.fill('input#title', 'Security Guard Services');
    await page.selectOption('select#procurementType', 'services');

    // Check Outsourcing Personnel
    await page.check('text=Outsourcing Service Personnel >> .. >> input[type="checkbox"]');

    // Select cost
    await page.waitForSelector('select#estimatedCost option:not([value=""])', {
      state: 'attached'
    });
    await page.selectOption('select#estimatedCost', { index: 1 });

    // Verify PPS2
    await page.waitForTimeout(500);
    const tenderType = await page.inputValue('select#tenderType');
    expect(tenderType).toBe('PPS2');
  });

  test('should allow manual override of auto-suggestion', async ({ page }) => {
    await page.fill('input#title', 'Test Manual Override');
    await page.selectOption('select#procurementType', 'goods');
    
    await page.waitForSelector('select#estimatedCost option:not([value=""])', {
      state: 'attached'
    });
    
    // Select cost that suggests PG1
    await page.selectOption('select#estimatedCost', { index: 1 });
    await page.waitForTimeout(500);
    
    // Verify auto-suggested PG1
    let tenderType = await page.inputValue('select#tenderType');
    expect(tenderType).toBe('PG1');

    // Manually select different option (if available)
    const optionCount = await page.locator('select#tenderType option[value!=""]').count();
    if (optionCount > 1) {
      await page.selectOption('select#tenderType', { index: 2 });
      tenderType = await page.inputValue('select#tenderType');
      expect(tenderType).not.toBe('PG1');
    }
  });

  test('should complete full tender creation with cascading selection', async ({ page }) => {
    // Fill all required fields
    await page.fill('input#title', 'E2E Test Tender Complete Flow');
    await page.selectOption('select#procurementType', 'goods');
    
    await page.waitForSelector('select#estimatedCost option:not([value=""])', {
      state: 'attached'
    });
    await page.selectOption('select#estimatedCost', { index: 1 });
    
    // Auto-suggestion should fill tender type
    await page.waitForTimeout(500);
    
    // Fill dates
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    const dateString = tomorrow.toISOString().slice(0, 16);
    await page.fill('input#submissionDeadline', dateString);

    // Submit form
    await page.click('button[type="submit"]');

    // Verify redirect to tender details
    await page.waitForURL(/\/tenders\/[a-f0-9-]+/, { timeout: 5000 });
    await expect(page.locator('text=E2E Test Tender Complete Flow')).toBeVisible();
  });

  test('should handle changing procurement type mid-form', async ({ page }) => {
    await page.fill('input#title', 'Test Type Change');
    
    // Select goods and cost
    await page.selectOption('select#procurementType', 'goods');
    await page.waitForSelector('select#estimatedCost option:not([value=""])', {
      state: 'attached'
    });
    await page.selectOption('select#estimatedCost', { index: 1 });
    await page.waitForTimeout(500);
    
    // Verify goods tender type suggested
    let tenderType = await page.inputValue('select#tenderType');
    expect(tenderType).toContain('PG');
    
    // Change to services
    await page.selectOption('select#procurementType', 'services');
    
    // Verify form resets properly
    await expect(page.locator('text=Outsourcing Service Personnel')).toBeVisible();
    await expect(page.locator('text=International Bidding')).not.toBeVisible();
  });

  test('should show validation error if tender type disabled', async ({ page }) => {
    await page.fill('input#title', 'Test Validation');
    
    // Try to submit without selecting procurement type
    await page.click('button[type="submit"]');
    
    // Should not submit
    await expect(page).toHaveURL('/tenders/new');
    
    // HTML5 validation should prevent submission
    const isValid = await page.evaluate(() => {
      const form = document.querySelector('form');
      return form?.checkValidity();
    });
    expect(isValid).toBe(false);
  });
});

test.describe('Tender Creation - Special Cases Priority', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'buyer@test.com');
    await page.fill('input[type="password"]', 'Test@1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await page.goto('/tenders/new');
  });

  test('Emergency should override all other selections', async ({ page }) => {
    await page.fill('input#title', 'Emergency Procurement Test');
    await page.selectOption('select#procurementType', 'goods');
    
    // Check International first
    await page.check('text=International Bidding >> .. >> input[type="checkbox"]');
    
    // Select cost
    await page.waitForSelector('select#estimatedCost option:not([value=""])', {
      state: 'attached'
    });
    await page.selectOption('select#estimatedCost', { index: 1 });
    await page.waitForTimeout(500);
    
    // Should suggest PG4 (international)
    let tenderType = await page.inputValue('select#tenderType');
    expect(tenderType).toBe('PG4');
    
    // Now check Emergency
    await page.check('text=Emergency >> .. >> input[type="checkbox"]');
    await page.waitForTimeout(500);
    
    // Should override to PG9A
    tenderType = await page.inputValue('select#tenderType');
    expect(tenderType).toBe('PG9A');
  });

  test('Turnkey should override value-based selection', async ({ page }) => {
    await page.fill('input#title', 'Turnkey Priority Test');
    await page.selectOption('select#procurementType', 'goods');
    
    // Select high value that would normally suggest PG3
    await page.waitForSelector('select#estimatedCost option:not([value=""])', {
      state: 'attached'
    });
    const lastIndex = await page.locator('select#estimatedCost option').count() - 1;
    await page.selectOption('select#estimatedCost', { index: lastIndex });
    await page.waitForTimeout(500);
    
    // Without turnkey, should be PG3 or similar
    let tenderType = await page.inputValue('select#tenderType');
    const originalType = tenderType;
    
    // Check turnkey
    await page.check('text=Turnkey Contract >> .. >> input[type="checkbox"]');
    await page.waitForTimeout(500);
    
    // Should change to PG5A
    tenderType = await page.inputValue('select#tenderType');
    expect(tenderType).toBe('PG5A');
    expect(tenderType).not.toBe(originalType);
  });
});
```

**Run command:**
```bash
cd rfq-platform/frontend
npm run test:e2e -- tender-creation-cascade.spec.ts
```

**Expected Results:**
- ✅ All E2E tests pass
- ✅ Complete user flows work end-to-end
- ✅ Visual feedback is appropriate
- ✅ No JavaScript errors in console

---

## Phase 5: Manual QA Testing

### 5.1 Test Scenarios Checklist

**Scenario 1: Goods Procurement Decision Tree**

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1.1 | Select "Goods" procurement type | International/Turnkey/Emergency checkboxes appear | [ ] |
| 1.2 | Select "Up to 8 Lac" cost | PG1 auto-suggested | [ ] |
| 1.3 | Select "8-50 Lac" cost | PG2 auto-suggested | [ ] |
| 1.4 | Select "Above 50 Lac" cost | PG3 auto-suggested | [ ] |
| 1.5 | Check International flag | Changes to PG4 regardless of cost | [ ] |
| 1.6 | Uncheck International, Check Turnkey | Changes to PG5A | [ ] |
| 1.7 | Check Emergency flag | Changes to PG9A | [ ] |
| 1.8 | Uncheck all special flags | Reverts to cost-based (PG1/PG2/PG3) | [ ] |

**Scenario 2: Works Procurement**

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 2.1 | Select "Works" procurement type | International/Turnkey checkboxes hidden | [ ] |
| 2.2 | Select cost ≤ 15 Lac | PW1 suggested | [ ] |
| 2.3 | Select cost > 5 Crore | PW3 suggested | [ ] |
| 2.4 | Verify gap (15 Lac - 5 Crore) | Shows appropriate message or option | [ ] |

**Scenario 3: Services Procurement**

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 3.1 | Select "Services" procurement type | Outsourcing Personnel checkbox appears | [ ] |
| 3.2 | Check Outsourcing Personnel | PPS2 suggested | [ ] |
| 3.3 | Uncheck Outsourcing | PPS3 suggested | [ ] |
| 3.4 | Check Emergency | PPS6 suggested | [ ] |

**Scenario 4: Edge Cases**

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 4.1 | Change procurement type mid-form | Form resets, checkboxes update | [ ] |
| 4.2 | Try to select cost before procurement type | Cost dropdown disabled | [ ] |
| 4.3 | Simulate API failure | Graceful error message shown | [ ] |
| 4.4 | Test on slow network | Loading states visible | [ ] |
| 4.5 | Rapidly change selections | No race conditions, consistent state | [ ] |
| 4.6 | Multiple checkboxes checked | Correct priority applied (Emergency > Turnkey > International > Value) | [ ] |

**Scenario 5: UI/UX**

| Aspect | Criteria | Status |
|--------|----------|--------|
| Labels | Clear and descriptive | [ ] |
| Helper text | Provides adequate guidance | [ ] |
| Disabled states | Visually obvious | [ ] |
| Auto-suggestion | User gets feedback about auto-fill | [ ] |
| Manual override | Obviously allowed and functional | [ ] |
| Error messages | Clear and actionable | [ ] |
| Loading states | Shown during API calls | [ ] |
| Responsive | Works on different screen sizes | [ ] |

**Scenario 6: Data Integrity**

| Test | Expected Result | Status |
|------|----------------|--------|
| All tender types in database | Appear in appropriate dropdowns | [ ] |
| Value ranges | Non-overlapping and complete | [ ] |
| Special cases | Correctly mapped per procurement type | [ ] |
| Submitted tenders | Correct type saved to database | [ ] |

---

## Phase 6: Performance & Load Testing

### 6.1 API Performance Benchmarks

**Target Metrics:**
- `/api/tender-types/ranges` response time: < 200ms (first call)
- `/api/tender-types/ranges` response time: < 50ms (cached)
- Concurrent requests: 100 simultaneous without errors

**Test Script:**

```typescript
// In backend tests
describe('Performance Benchmarks', () => {
  test('Range endpoint should respond under 200ms (cold)', async () => {
    // Clear cache first
    await redisClient.flushdb();
    
    const start = performance.now();
    await getValueRangesForProcurementType('goods');
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(200);
  });

  test('Range endpoint should respond under 50ms (warm cache)', async () => {
    // Prime cache
    await getValueRangesForProcurementType('goods');
    
    const start = performance.now();
    await getValueRangesForProcurementType('goods');
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(50);
  });

  test('Should handle 100 concurrent requests', async () => {
    const promises = Array(100).fill(null).map(() =>
      request(app)
        .get('/api/tender-types/ranges?procurementType=goods')
        .set('Authorization', `Bearer ${authToken}`)
    );
    
    const start = Date.now();
    const results = await Promise.all(promises);
    const duration = Date.now() - start;
    
    results.forEach(res => {
      expect(res.status).toBe(200);
    });
    
    // All 100 requests should complete within 2 seconds
    expect(duration).toBeLessThan(2000);
  });

  test('Database query should be optimized', async () => {
    // Verify indexes are used
    const explain = await pool.query(`
      EXPLAIN ANALYZE 
      SELECT * FROM tender_type_definitions 
      WHERE is_active = TRUE AND procurement_type = 'goods'
    `);
    
    const plan = explain.rows[0]['QUERY PLAN'];
    expect(plan).toContain('Index Scan');
  });
});
```

### 6.2 Frontend Performance Tests

```typescript
// In frontend tests
test('should render dropdown cascade within 100ms', async () => {
  const start = performance.now();
  
  render(TenderNewPage, {
    context: new Map([['$$_queryClient', queryClient]])
  });
  
  const duration = performance.now() - start;
  expect(duration).toBeLessThan(100);
});

test('should handle rapid dropdown changes without lag', async () => {
  render(TenderNewPage, {
    context: new Map([['$$_queryClient', queryClient]])
  });

  const procurementSelect = screen.getByLabelText(/procurement type/i);
  
  const start = performance.now();
  
  // Rapidly change selections
  for (let i = 0; i < 10; i++) {
    await fireEvent.change(procurementSelect, { target: { value: 'goods' } });
    await fireEvent.change(procurementSelect, { target: { value: 'services' } });
    await fireEvent.change(procurementSelect, { target: { value: 'works' } });
  }
  
  const duration = performance.now() - start;
  
  // Should handle 30 changes in under 500ms
  expect(duration).toBeLessThan(500);
});
```

### 6.3 Memory Leak Tests

```typescript
test('should not leak memory on repeated renders', async () => {
  const initialMemory = performance.memory?.usedJSHeapSize;
  
  // Render and unmount 100 times
  for (let i = 0; i < 100; i++) {
    const { unmount } = render(TenderNewPage, {
      context: new Map([['$$_queryClient', new QueryClient()]])
    });
    unmount();
  }
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  const finalMemory = performance.memory?.usedJSHeapSize;
  
  // Memory increase should be minimal (< 10MB)
  if (initialMemory && finalMemory) {
    expect(finalMemory - initialMemory).toBeLessThan(10 * 1024 * 1024);
  }
});
```

---

## Phase 7: Regression Testing

### 7.1 Existing Features Verification

**Core Tender Functionality:**
- [ ] Regular tender creation (without cascade) still works
- [ ] Tender list page displays correctly
- [ ] Tender detail page shows correct information
- [ ] Tender editing functionality intact
- [ ] Tender deletion works
- [ ] Tender publishing workflow unchanged

**Related Components:**
- [ ] TenderTypeInfo component displays correctly
- [ ] ValueValidator component validates properly
- [ ] SecurityCalculator calculates correctly
- [ ] Document checklist generation works
- [ ] Bid submission process unaffected

**Authentication & Authorization:**
- [ ] Buyer login works
- [ ] Vendor login works
- [ ] Role-based access control intact
- [ ] Session management unchanged

**API Endpoints:**
- [ ] `GET /api/tender-types` still works
- [ ] `GET /api/tender-types/:code` still works
- [ ] `POST /api/tender-types/suggest` still works
- [ ] `POST /api/tender-types/validate-value` still works
- [ ] `POST /api/tender-types/calculate-securities` still works

### 7.2 Database Integrity

```sql
-- Verify no data corruption
SELECT COUNT(*) FROM tender_type_definitions WHERE is_active = TRUE;
-- Should match expected count (11 types)

-- Verify all procurement types covered
SELECT DISTINCT procurement_type FROM tender_type_definitions;
-- Should return: goods, works, services

-- Verify no orphaned tenders
SELECT COUNT(*) FROM tenders t
LEFT JOIN tender_type_definitions ttd ON t.tender_type = ttd.code
WHERE ttd.code IS NULL;
-- Should return: 0
```

---

## Test Execution Schedule

### **Day 1-2: Backend Testing**
- **Day 1 Morning:** Write service unit tests
- **Day 1 Afternoon:** Run and debug service tests
- **Day 2 Morning:** Write API integration tests
- **Day 2 Afternoon:** Run and debug API tests
- **Target:** 95%+ coverage for new backend code

### **Day 3: Frontend Testing**
- **Morning:** Write component unit tests
- **Afternoon:** Run and debug component tests
- **Target:** 85%+ coverage for new frontend code

### **Day 4: E2E Testing**
- **Morning:** Write Playwright E2E tests
- **Afternoon:** Run E2E tests, fix failures
- **Target:** All critical paths covered

### **Day 5: Manual QA**
- **Morning:** Execute manual test scenarios (Scenarios 1-3)
- **Afternoon:** Execute edge cases and UI/UX scenarios (Scenarios 4-5)
- **Output:** Bug list with severity ratings

### **Day 6: Performance & Regression**
- **Morning:** Run performance benchmarks
- **Afternoon:** Execute regression test suite
- **Output:** Performance report, regression status

### **Day 7: Final Validation**
- **Morning:** Fix all critical/high bugs
- **Afternoon:** Re-run full test suite
- **Output:** Test coverage report, sign-off document

---

## Test Coverage Goals

| Component | Target Coverage | Critical |
|-----------|----------------|----------|
| Backend Services | 95%+ | ✅ Yes |
| Backend API Routes | 100% | ✅ Yes |
| Backend Controllers | 95%+ | ✅ Yes |
| Frontend Components | 85%+ | ✅ Yes |
| Frontend Utils | 90%+ | No |
| E2E Critical Paths | 100% | ✅ Yes |

---

## Commands Quick Reference

### Backend Tests
```bash
cd rfq-platform/backend

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- tenderTypeSelector.service.test.ts
npm test -- tenderTypeRanges.api.test.ts

# Watch mode
npm run test:watch

# Run only integration tests
npm test -- --testPathPattern=integration
```

### Frontend Tests
```bash
cd rfq-platform/frontend

# Run all unit tests
npm test

# Run with coverage
npm run coverage

# Run specific test file
npm test -- +page.test.ts

# Watch mode
npm test -- --watch

# E2E tests
npm run test:e2e                                      # Headless
npm run test:e2e:ui                                   # With UI
npm run test:e2e -- tender-creation-cascade.spec.ts   # Specific file
npm run test:e2e -- --debug                           # Debug mode
```

### All Tests
```bash
# Run everything from project root
cd rfq-platform/backend && npm test && \
cd ../frontend && npm test && npm run test:e2e
```

---

## Bug Tracking Template

| ID | Severity | Component | Description | Steps to Reproduce | Expected | Actual | Status | Assignee |
|----|----------|-----------|-------------|-------------------|----------|--------|--------|----------|
| TC-001 | Critical | Backend API | 500 error on invalid type | Send GET /ranges?procurementType=invalid | 400 error | 500 error | Open | - |
| TC-002 | High | Frontend | Dropdown doesn't reset | Change procurement type | Dropdowns reset | Values remain | Open | - |
| TC-003 | Medium | Frontend | Loading state missing | Select procurement type | Loading spinner | No feedback | Open | - |
| TC-004 | Low | UI | Label text unclear | Read helper text | Clear guidance | Confusing | Open | - |

**Severity Definitions:**
- **Critical:** Blocks core functionality, data corruption
- **High:** Major feature broken, poor UX
- **Medium:** Feature works but with issues
- **Low:** Minor cosmetic or UX improvement

---

## Success Criteria

Before marking testing complete, verify:

✅ **Unit Tests**
- [ ] All backend service tests pass
- [ ] All frontend component tests pass
- [ ] Code coverage meets targets

✅ **Integration Tests**
- [ ] All API endpoint tests pass
- [ ] All error scenarios handled
- [ ] Performance benchmarks met

✅ **E2E Tests**
- [ ] All critical user flows pass
- [ ] Cross-browser testing done (Chrome, Firefox, Safari)
- [ ] Mobile responsive testing done

✅ **Manual QA**
- [ ] All manual scenarios pass
- [ ] UI/UX meets standards
- [ ] Accessibility verified

✅ **Performance**
- [ ] API response times < targets
- [ ] Frontend render times < 100ms
- [ ] No memory leaks detected

✅ **Regression**
- [ ] No existing features broken
- [ ] Database integrity maintained
- [ ] Zero critical/high severity bugs

✅ **Documentation**
- [ ] Test results documented
- [ ] Known issues logged
- [ ] Sign-off obtained

---

## Sign-Off

### Testing Team Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Lead | | | |
| Backend Developer | | | |
| Frontend Developer | | | |
| Product Owner | | | |

### Test Results Summary

- **Total Tests:** _____
- **Passed:** _____
- **Failed:** _____
- **Skipped:** _____
- **Code Coverage:** _____%
- **Critical Bugs:** _____
- **High Bugs:** _____

**Approved for Production:** [ ] YES  [ ] NO

---

## Appendix

### A. Test Data

Create test users with specific roles:
```sql
-- Buyer account for testing
INSERT INTO users (email, password_hash, role, organization_id)
VALUES ('buyer@test.com', '$hashed_password', 'buyer', 'test-org-id');

-- Vendor account for testing
INSERT INTO users (email, password_hash, role, organization_id)
VALUES ('vendor@test.com', '$hashed_password', 'vendor', 'test-vendor-id');
```

### B. Environment Setup

**Test Environment Variables:**
```env
NODE_ENV=test
DATABASE_URL=postgresql://test_user:test_pass@localhost:5432/rfq_test
REDIS_URL=redis://localhost:6379/1
JWT_SECRET=test-secret-key
```

### C. Useful Testing Links

- Backend Tests: `http://localhost:3333/test-results`
- Frontend Tests: `http://localhost:5173/__coverage__`
- E2E Report: `rfq-platform/frontend/playwright-report/index.html`
- Coverage Report: `rfq-platform/*/coverage/lcov-report/index.html`

---

**Document Version:** 1.0  
**Last Updated:** February 8, 2026  
**Next Review:** After implementation completion  

---

**End of QA & Integration Testing Plan**
