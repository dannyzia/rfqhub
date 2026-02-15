import { test, expect } from '@playwright/test';

/** Select procurement type and wait for cost dropdown to be populated from API. */
async function selectProcurementTypeAndWaitRanges(
  page: import('@playwright/test').Page,
  value: 'goods' | 'works' | 'services'
) {
  // Wait for the value-ranges API response for this procurement type (ensures we get the response we triggered)
  const responsePromise = page.waitForResponse(
    (res) => {
      const url = res.url();
      return (
        url.includes('/tender-types/ranges') &&
        url.includes(`procurementType=${value}`) &&
        res.request().method() === 'GET'
      );
    },
    { timeout: 15000 }
  );
  await page.selectOption('select#procurementType', value);
  const response = await responsePromise;
  expect(
    response.status(),
    'Value ranges API must return 200 (backend running and auth token valid)'
  ).toBe(200);
  const body = await response.json();
  const ranges = body?.data?.ranges;
  expect(
    Array.isArray(ranges) && ranges.length > 0,
    `Backend returned empty value ranges (got ${JSON.stringify(ranges?.length ?? 'no .data.ranges')}). Ensure tender_type_definitions table is populated (run migrations/seeds).`
  ).toBe(true);
  
  // Debug: Log the actual DOM state before waiting
  const estimatedCostSelect = page.locator('select#estimatedCost');
  const dataValueRangesLoaded = await estimatedCostSelect.getAttribute('data-value-ranges-loaded').catch(() => 'not-found');
  const selectDisabled = await estimatedCostSelect.isDisabled().catch(() => null);
  const optionCount = await estimatedCostSelect.locator('option').count().catch(() => 0);
  
  console.log(`  [Debug] After API response:
    - data-value-ranges-loaded="${dataValueRangesLoaded}"
    - select disabled=${selectDisabled}
    - option count=${optionCount}`);
  
  // Debug: Check if stores have data by evaluating in browser context
  const storeDebug = await page.evaluate(() => {
    try {
      // Try to access the window object to see if our stores are accessible
      const procurementType = (document.querySelector('select#procurementType') as HTMLSelectElement)?.value;
      const estimatedCostSelect = document.querySelector('select#estimatedCost') as HTMLSelectElement;
      const attr = estimatedCostSelect?.getAttribute('data-value-ranges-loaded');
      const optionsCount = estimatedCostSelect?.querySelectorAll('option').length;
      
      return {
        procurementType,
        dataAttr: attr,
        optionsCount,
        selectExists: !!estimatedCostSelect
      };
    } catch (e: any) {
      return { error: e.message };
    }
  });
  console.log(`  [Debug] Browser evaluation:`, JSON.stringify(storeDebug, null, 2));
  
  // Wait for frontend to apply the data (data attribute set when valueRangesQuery.data.ranges is populated)
  try {
    await page.waitForSelector('select#estimatedCost[data-value-ranges-loaded="true"]', {
      timeout: 15000,
    });
  } catch {
    // Debug: Show current state
    const finalAttr = await estimatedCostSelect.getAttribute('data-value-ranges-loaded').catch(() => 'not-found');
    const finalDisabled = await estimatedCostSelect.isDisabled().catch(() => null);
    const finalOptions = await estimatedCostSelect.locator('option').count().catch(() => 0);
    console.log(`  [Debug] Before timeout:
    - Final data-value-ranges-loaded="${finalAttr}"
    - Final select disabled=${finalDisabled}
    - Final option count=${finalOptions}`);
    throw new Error(
      'Backend returned value ranges but the UI did not update. ' +
        'Check that CORS allows the frontend origin and that the backend at VITE_API_URL returns JSON with data.ranges.'
    );
  }
}

test.describe('Tender Creation - Cascading Dropdowns', () => {
  test.beforeEach(async ({ page }) => {
    // Capture browser console messages for debugging
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[DEBUG]')) {
        console.log(`  [Browser Console] ${text}`);
      }
    });
    
    await page.goto('/dashboard', { waitUntil: 'load' });
    const dashboardHeading = page.getByRole('heading', { name: /Dashboard/i });
    const loginEmail = page.locator('input#email');
    const result = await Promise.race([
      dashboardHeading.waitFor({ state: 'visible', timeout: 25000 }).then(() => 'dashboard' as const),
      loginEmail.waitFor({ state: 'visible', timeout: 25000 }).then(() => 'login' as const),
    ]);
    if (result === 'login') throw new Error('E2E auth failed: landed on login. Ensure backend is running and GET /auth/me returns 200.');
    await page.locator('a[href="/tenders/new"]').first().click();
    await expect(page.locator('main h1')).toContainText('Create New Tender', { timeout: 10000 });
  });

  test('should cascade from Goods → Cost → Auto-suggest PG1', async ({ page }) => {
    // Step 1: Fill title
    await page.fill('input#title', 'Test Procurement of Office Supplies');

    // Step 2: Select Goods (wait for ranges API so cost options load)
    await selectProcurementTypeAndWaitRanges(page, 'goods');

    // Step 3: Verify special checkboxes appear
    await expect(page.locator('text=International Bidding')).toBeVisible();
    await expect(page.locator('text=Turnkey Contract')).toBeVisible();

    // Step 4: Select cost range (Up to 8 Lac) — options already loaded by helper
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
    await selectProcurementTypeAndWaitRanges(page, 'goods');

    // Check International Bidding
    await page.check('text=International Bidding >> .. >> input[type="checkbox"]');

    // Select cost
    await page.selectOption('select#estimatedCost', { index: 1 });

    // Verify PG4 auto-suggested
    await page.waitForTimeout(500);
    const tenderType = await page.inputValue('select#tenderType');
    expect(tenderType).toBe('PG4');
  });

  test('should suggest PG5A for Turnkey contract', async ({ page }) => {
    await page.fill('input#title', 'Factory Equipment Installation');
    await selectProcurementTypeAndWaitRanges(page, 'goods');

    // Check Turnkey
    await page.check('text=Turnkey Contract >> .. >> input[type="checkbox"]');

    // Select cost
    await page.selectOption('select#estimatedCost', { index: 2 });

    // Verify PG5A
    await page.waitForTimeout(500);
    const tenderType = await page.inputValue('select#tenderType');
    expect(tenderType).toBe('PG5A');
  });

  test('should handle Works procurement properly', async ({ page }) => {
    await page.fill('input#title', 'Road Construction Project');
    await selectProcurementTypeAndWaitRanges(page, 'works');

    // Verify special checkboxes NOT shown (except emergency)
    await expect(page.locator('text=International Bidding')).not.toBeVisible();
    await expect(page.locator('text=Turnkey Contract')).not.toBeVisible();

    // Select cost for PW1 range (under 15 Lac)
    await page.selectOption('select#estimatedCost', { index: 1 });

    // Verify PW1 suggested
    await page.waitForTimeout(500);
    const tenderType = await page.inputValue('select#tenderType');
    expect(tenderType).toBe('PW1');
  });

  test('should suggest PPS2 for outsourcing personnel', async ({ page }) => {
    await page.fill('input#title', 'Security Guard Services');
    await selectProcurementTypeAndWaitRanges(page, 'services');

    // Check Outsourcing Personnel
    await page.check('text=Outsourcing Service Personnel >> .. >> input[type="checkbox"]');

    // Select cost
    await page.selectOption('select#estimatedCost', { index: 1 });

    // Verify PPS2
    await page.waitForTimeout(500);
    const tenderType = await page.inputValue('select#tenderType');
    expect(tenderType).toBe('PPS2');
  });

  test('should allow manual override of auto-suggestion', async ({ page }) => {
    await page.fill('input#title', 'Test Manual Override');
    await selectProcurementTypeAndWaitRanges(page, 'goods');

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
    await selectProcurementTypeAndWaitRanges(page, 'goods');
    
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
    await selectProcurementTypeAndWaitRanges(page, 'goods');
    await page.selectOption('select#estimatedCost', { index: 1 });
    await page.waitForTimeout(500);
    
    // Verify goods tender type suggested
    let tenderType = await page.inputValue('select#tenderType');
    expect(tenderType).toContain('PG');
    
    // Change to services
    await selectProcurementTypeAndWaitRanges(page, 'services');
    
    // Verify form resets properly
    await expect(page.locator('text=Outsourcing Service Personnel')).toBeVisible();
    await expect(page.locator('text=International Bidding')).not.toBeVisible();
  });

  test('should show validation error if tender type disabled', async ({ page }) => {
    await page.fill('input#title', 'Test Validation');
    // Do not select procurement type or tender type

    // Submit button should be disabled when required fields are missing
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
    await expect(page).toHaveURL(/\/tenders\/new/);

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
    await page.goto('/dashboard', { waitUntil: 'load' });
    const dashboardHeading = page.getByRole('heading', { name: /Dashboard/i });
    const loginEmail = page.locator('input#email');
    const result = await Promise.race([
      dashboardHeading.waitFor({ state: 'visible', timeout: 25000 }).then(() => 'dashboard' as const),
      loginEmail.waitFor({ state: 'visible', timeout: 25000 }).then(() => 'login' as const),
    ]);
    if (result === 'login') throw new Error('E2E auth failed: landed on login. Ensure backend is running and GET /auth/me returns 200.');
    await page.locator('a[href="/tenders/new"]').first().click();
    await expect(page.locator('main h1')).toContainText('Create New Tender', { timeout: 10000 });
  });

  test('Emergency should override all other selections', async ({ page }) => {
    await page.fill('input#title', 'Emergency Procurement Test');
    await selectProcurementTypeAndWaitRanges(page, 'goods');

    // Check International first
    await page.check('text=International Bidding >> .. >> input[type="checkbox"]');

    // Select cost
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
    await selectProcurementTypeAndWaitRanges(page, 'goods');

    // Select high value that would normally suggest PG3
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
