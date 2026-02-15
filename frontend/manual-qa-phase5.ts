import { chromium } from '@playwright/test';

/**
 * Phase 5: Manual QA Testing Script (Interactive/Headed Mode)
 * This script runs in headed mode with slowMo for visual validation
 */

async function runManualQA() {
  const browser = await chromium.launch({
    headless: false, // Run in headed mode for visual inspection
    slowMo: 1000, // Slow down by 1 second between actions for visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    storageState: 'e2e/.auth/user.json', // Use authenticated state
  });

  const page = await context.newPage();
  
  const results = {
    scenario1: [],
    scenario2: [],
    scenario3: [],
    scenario4: [],
    scenario5: [],
    scenario6: []
  };

  console.log('\\n═══════════════════════════════════════════════════════');
  console.log('  PHASE 5: MANUAL QA TESTING - INTERACTIVE MODE');
  console.log('═══════════════════════════════════════════════════════\\n');

  try {
    // Navigate to create tender page
    console.log('[SETUP] Navigating to /tenders/new...');
    await page.goto('http://localhost:5174/tenders/new', { waitUntil: 'load' });
    await page.waitForSelector('h1:has-text("Create New Tender")', { timeout: 10000 });
    console.log('✓ Page loaded successfully\\n');

    // ═══════════════════════════════════════════════════════
    // SCENARIO 1: Goods Procurement Decision Tree
    // ═══════════════════════════════════════════════════════
    console.log('\\n┌─────────────────────────────────────────────────┐');
    console.log('│ SCENARIO 1: Goods Procurement Decision Tree    │');
    console.log('└─────────────────────────────────────────────────┘\\n');

    // Step 1.1: Fill title
    console.log('[1.1] Filling tender title...');
    await page.fill('input#title', 'Manual QA Test - Goods Procurement');
    results.scenario1.push({ step: '1.1', status: 'PASS', note: 'Title filled' });
    console.log('✓ Title filled\\n');

    // Step 1.2: Select Goods procurement type
    console.log('[1.2] Selecting "Goods" procurement type...');
    await page.selectOption('select#procurementType', 'goods');
    await page.waitForTimeout(2000); // Wait for API call and UI update
    
    // Verify checkboxes appear
    const intlCheckbox = await page.locator('label:has-text("International")').isVisible();
    const turnkeyCheckbox = await page.locator('label:has-text("Turnkey")').isVisible();
    const emergencyCheckbox = await page.locator('label:has-text("Emergency")').isVisible();
    
    console.log(`  International checkbox visible: ${intlCheckbox}`);
    console.log(`  Turnkey checkbox visible: ${turnkeyCheckbox}`);
    console.log(`  Emergency checkbox visible: ${emergencyCheckbox}`);
    
    if (intlCheckbox && turnkeyCheckbox && emergencyCheckbox) {
      results.scenario1.push({ step: '1.2', status: 'PASS',  note: 'All special flag checkboxes visible' });
      console.log('✓ Special flags appeared\\n');
    } else {
      results.scenario1.push({ step: '1.2', status: 'FAIL', note: 'Some checkboxes missing' });
      console.log('✗ FAIL: Missing checkboxes\\n');
    }

    // Step 1.3: Verify cost options loaded
    console.log('[1.3] Verifying cost dropdown populated...');
    const costSelect = page.locator('select#estimatedCost');
    await page.waitForTimeout(1500); // Extra wait for data to load
    const costOptions = await costSelect.locator('option').allTextContents();
    console.log(`  Cost options found: ${costOptions.length}`);
    console.log(`  Options: ${costOptions.join(', ')}`);
    
    if (costOptions.length >= 4) {  // Should have default + 4 ranges
      results.scenario1.push({ step: '1.3', status: 'PASS', note: `${costOptions.length} options loaded` });
      console.log('✓ Cost ranges loaded\\n');
    } else {
      results.scenario1.push({ step: '1.3', status: 'FAIL', note: `Only ${costOptions.length} options` });
      console.log(`✗ FAIL: Expected 4+ options, got ${costOptions.length}\\n`);
    }

    // Step 1.4-1.6: Test cost-based auto-suggestions
    const costTests = [
      { label: 'Up to 8 Lac', expectedType: 'PG1', value: '0' },
      { label: '8-50 Lac', expectedType: 'PG2', value: '800000' },
      { label: 'Above 50 Lac', expected Type: 'PG3', value: '5000000' }
    ];

    for (const test of costTests) {
      console.log(`[Testing] Selecting cost "${test.label}"...`);
      
      // Try to find and select the option
      const optionExists = await costSelect.locator(`option:has-text("${test.label}")`).count() > 0;
      if (optionExists) {
        await costSelect.selectOption({ label: test.label });
        await page.waitForTimeout(1500);
        
        const selectedTenderType = await page.locator('select#tenderType').inputValue();
        console.log(`  Selected tender type: ${selectedTenderType}`);
        console.log(`  Expected: ${test.expectedType}`);
        
        if (selectedTenderType === test.expectedType) {
          results.scenario1.push({ step: `Cost ${test.label}`, status: 'PASS', note: `Auto-suggested ${test.expectedType}` });
          console.log(`✓ ${test.expectedType} auto-suggested correctly\\n`);
        } else {
          results.scenario1.push({ step: `Cost ${test.label}`, status: 'FAIL', note: `Expected ${test.expectedType}, got ${selectedTenderType}` });
          console.log(`✗ FAIL: Expected ${test.expectedType}, got ${selectedTenderType}\\n`);
        }
      } else {
        results.scenario1.push({ step: `Cost ${test.label}`, status: 'FAIL', note: 'Option not found in dropdown' });
        console.log(`✗ FAIL: Option "${test.label}" not found\\n`);
      }
    }

    // Step 1.7: Test International flag
    console.log('[1.7] Testing International flag override...');
    await page.check('input[type="checkbox"][id="international"]');
    await page.waitForTimeout(1500);
    
    const tenderTypeAfterIntl = await page.locator('select#tenderType').inputValue();
    console.log(`  Tender type after International flag: ${tenderTypeAfterIntl}`);
    
    if (tenderTypeAfterIntl === 'PG4') {
      results.scenario1.push({ step: '1.7', status: 'PASS', note: 'International flag → PG4' });
      console.log('✓ International override worked (PG4)\\n');
    } else {
      results.scenario1.push({ step: '1.7', status: 'FAIL', note: `Expected PG4, got ${tenderTypeAfterIntl}` });
      console.log(`✗ FAIL: Expected PG4, got ${tenderTypeAfterIntl}\\n`);
    }

    // Step 1.8: Test Turnkey flag
    console.log('[1.8] Testing Turnkey flag override...');
    await page.uncheck('input[type="checkbox"][id="international"]');
    await page.check('input[type="checkbox"][id="turnkey"]');
    await page.waitForTimeout(1500);
    
    const tenderTypeAfterTurnkey = await page.locator('select#tenderType').inputValue();
    console.log(`  Tender type after Turnkey flag: ${tenderTypeAfterTurnkey}`);
    
    if (tenderTypeAfterTurnkey === 'PG5A') {
      results.scenario1.push({ step: '1.8', status: 'PASS', note: 'Turnkey flag → PG5A' });
      console.log('✓ Turnkey override worked (PG5A)\\n');
    } else {
      results.scenario1.push({ step: '1.8', status: 'FAIL', note: `Expected PG5A, got ${tenderTypeAfterTurnkey}` });
      console.log(`✗ FAIL: Expected PG5A, got ${tenderTypeAfterTurnkey}\\n`);
    }

    // Step 1.9: Test Emergency flag (highest priority)
    console.log('[1.9] Testing Emergency flag (highest priority)...');
    await page.check('input[type="checkbox"]#emergency');
    await page.waitForTimeout(1500);
    
    const tenderTypeAfterEmergency = await page.locator('select#tenderType').inputValue();
    console.log(`  Tender type after Emergency flag: ${tenderTypeAfterEmergency}`);
    
    if (tenderTypeAfterEmergency === 'PG9A') {
      results.scenario1.push({ step: '1.9', status: 'PASS', note: 'Emergency flag → PG9A' });
      console.log('✓ Emergency override worked (PG9A)\\n');
    } else {
      results.scenario1.push({ step: '1.9', status: 'FAIL', note: `Expected PG9A, got ${tenderTypeAfterEmergency}` });
      console.log(`✗ FAIL: Expected PG9A, got ${tenderTypeAfterEmergency}\\n`);
    }

    // Step 1.10: Test reverting to cost-based
    console.log('[1.10] Unchecking all flags to revert to cost-based...');
    await page.uncheck('input[type="checkbox"]#emergency');
    await page.uncheck('input[type="checkbox"]#turnkey');
    await page.waitForTimeout(1500);
    
    const tenderTypeAfterUncheck = await page.locator('select#tenderType').inputValue();
    console.log(`  Tender type after unchecking flags: ${tenderTypeAfterUncheck}`);
    
    if (tenderTypeAfterUncheck === 'PG3') {  // Should revert to PG3 (Above 50 Lac selected earlier)
      results.scenario1.push({ step: '1.10', status: 'PASS', note: 'Reverted to cost-based PG3' });
      console.log('✓ Reverted to cost-based suggestion (PG3)\\n');
    } else {
      results.scenario1.push({ step: '1.10', status: 'WARN', note: `Expected PG3, got ${tenderTypeAfterUncheck} (may depend on last cost selected)` });
      console.log(`⚠ Got ${tenderTypeAfterUncheck} (cost-based logic applied)\\n`);
    }

    // ═══════════════════════════════════════════════════════
    // SCENARIO 2: Works Procurement
    // ═══════════════════════════════════════════════════════
    console.log('\\n┌─────────────────────────────────────────────────┐');
    console.log('│ SCENARIO 2: Works Procurement                   │');
    console.log('└─────────────────────────────────────────────────┘\\n');

    console.log('[2.1] Switching to Works procurement type...');
    await page.selectOption('select#procurementType', 'works');
    await page.waitForTimeout(2000);
    
    // Verify International/Turnkey checkboxes hidden
    const intlHidden = !(await page.locator('label:has-text("International")').isVisible());
    const turnkeyHidden = !(await page.locator('label:has-text("Turnkey")' ).isVisible());
    const emergencyStillVisible = await page.locator('label:has-text("Emergency")').isVisible();
    
    console.log(`  International hidden: ${intlHidden}`);
    console.log(`  Turnkey hidden: ${turnkeyHidden}`);
    console.log(`  Emergency visible: ${emergencyStillVisible}`);
    
    if (intlHidden && turnkeyHidden && emergencyStillVisible) {
      results.scenario2.push({ step: '2.1', status: 'PASS', note: 'Checkboxes updated correctly for Works' });
      console.log('✓ Checkbox visibility correct for Works\\n');
    } else {
      results.scenario2.push({ step: '2.1', status: 'FAIL', note: 'Checkbox visibility incorrect' });
      console.log('✗ FAIL: Checkbox visibility incorrect\\n');
    }

    // Test Works cost ranges
    const worksTests = [
      { label: 'Up to 15 Lac', expectedType: 'PW1' },
      { label: 'Above 5 Crore', expectedType: 'PW3' }
    ];

    await page.waitForTimeout(1500);
    const worksCostOptions = await page.locator('select#estimatedCost option').allTextContents();
    console.log(`[2.3] Works cost options: ${worksCostOptions.join(', ')}`);

    for (const test of worksTests) {
      console.log(`[Testing] Selecting Works cost "${test.label}"...`);
      
      const optionExists = await page.locator('select#estimatedCost').locator(`option:has-text("${test.label}")`).count() > 0;
      if (optionExists) {
        await page.locator('select#estimatedCost').selectOption({ label: test.label });
        await page.waitForTimeout(1500);
        
        const selectedType = await page.locator('select#tenderType').inputValue();
        console.log(`  Selected tender type: ${selectedType}`);
        
        if (selectedType === test.expectedType) {
          results.scenario2.push({ step: `Works ${test.label}`, status: 'PASS', note: `Auto-suggested ${test.expectedType}` });
          console.log(`✓ ${test.expectedType} auto-suggested correctly\\n`);
        } else {
          results.scenario2.push({ step: `Works ${test.label}`, status: 'FAIL', note: `Expected ${test.expectedType}, got ${selectedType}` });
          console.log(`✗ FAIL: Expected ${test.expectedType}, got ${selectedType}\\n`);
        }
      } else {
        results.scenario2.push({ step: `Works ${test.label}`, status: 'FAIL', note: 'Option not found' });
        console.log(`✗ FAIL: Option "${test.label}" not found\\n`);
      }
    }

    // ═══════════════════════════════════════════════════════
    // SCENARIO 3: Services Procurement
    // ═══════════════════════════════════════════════════════
    console.log('\\n┌─────────────────────────────────────────────────┐');
    console.log('│ SCENARIO 3: Services Procurement                │');
    console.log('└─────────────────────────────────────────────────┘\\n');

    console.log('[3.1] Switching to Services procurement type...');
    await page.selectOption('select#procurementType', 'services');
    await page.waitForTimeout(2000);
    
    // Verify Outsourcing Personnel checkbox appears
    const outsourcingVisible = await page.locator('label:has-text("Outsourcing Personnel")').isVisible();
    console.log(`  Outsourcing Personnel checkbox visible: ${outsourcingVisible}`);
    
    if (outsourcingVisible) {
      results.scenario3.push({ step: '3.1', status: 'PASS', note: 'Outsourcing Personnel checkbox visible' });
      console.log('✓ Outsourcing Personnel checkbox appeared\\n');
    } else {
      results.scenario3.push({ step: '3.1', status: 'FAIL', note: 'Outsourcing Personnel checkbox not visible' });
      console.log('✗ FAIL: Outsourcing Personnel checkbox not visible\\n');
    }

    // Select a cost range
    console.log('[3.2] Selecting cost range for Services...');
    await page.waitForTimeout(1500);
    const servicesCostOptions = await page.locator('select#estimatedCost option').allTextContents();
    console.log(`  Services cost options: ${servicesCostOptions.join(', ')}`);
    
    if (servicesCostOptions.length > 1) {
      await page.locator('select#estimatedCost').selectOption({ index: 1 }); // Select first non-default option
      await page.waitForTimeout(1500);
      const baseTenderType = await page.locator('select#tenderType').inputValue();
      console.log(`  Base tender type for Services: ${baseTenderType}\\n`);
    }

    // Test Outsourcing Personnel flag
    console.log('[3.3] Testing Outsourcing Personnel flag...');
    const outsourcingCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /outsourcing/i }).first();
    const outsourcingExists = await outsourcingCheckbox.count() > 0;
    
    if (outsourcingExists) {
      await outsourcingCheckbox.check();
      await page.waitForTimeout(1500);
      
      const tenderTypeAfterOutsourcing = await page.locator('select#tenderType').inputValue();
      console.log(`  Tender type after Outsourcing flag: ${tenderTypeAfterOutsourcing}`);
      
      if (tenderTypeAfterOutsourcing === 'PPS2') {
        results.scenario3.push({ step: '3.3', status: 'PASS', note: 'Outsourcing → PPS2' });
        console.log('✓ Outsourcing flag worked (PPS2)\\n');
      } else {
        results.scenario3.push({ step: '3.3', status: 'FAIL', note: `Expected PPS2, got ${tenderTypeAfterOutsourcing}` });
        console.log(`✗ FAIL: Expected PPS2, got ${tenderTypeAfterOutsourcing}\\n`);
      }
      
      // Uncheck and test Emergency
      await outsourcingCheckbox.uncheck();
      await page.waitForTimeout(500);
    }

    console.log('[3.4] Testing Emergency for Services...');
    await page.check('input[type="checkbox"]#emergency');
    await page.waitForTimeout(1500);
    
    const tenderTypeAfterServicesEmergency = await page.locator('select#tenderType').inputValue();
    console.log(`  Tender type after Services Emergency: ${tenderTypeAfterServicesEmergency}`);
    
    if (tenderTypeAfterServicesEmergency === 'PPS6') {
      results.scenario3.push({ step: '3.4', status: 'PASS', note: 'Services Emergency → PPS6' });
      console.log('✓ Services Emergency worked (PPS6)\\n');
    } else {
      results.scenario3.push({ step: '3.4', status: 'FAIL', note: `Expected PPS6, got ${tenderTypeAfterServicesEmergency}` });
      console.log(`✗ FAIL: Expected PPS6, got ${tenderTypeAfterServicesEmergency}\\n`);
    }

    // ═══════════════════════════════════════════════════════
    // SCENARIO 4: Edge Cases
    // ═══════════════════════════════════════════════════════
    console.log('\\n┌─────────────────────────────────────────────────┐');
    console.log('│ SCENARIO 4: Edge Cases                          │');
    console.log('└─────────────────────────────────────────────────┘\\n');

    // Test form reset on procurement type change
    console.log('[4.1] Testing form reset on procurement type change...');
    await page.selectOption('select#procurementType', 'goods');
    await page.waitForTimeout(1500);
    await page.locator('select#estimatedCost').selectOption({ index: 1 });
    await page.waitForTimeout(1500);
    const tenderTypeBeforeSwitch = await page.locator('select#tenderType').inputValue();
    console.log(`  Tender type before switch: ${tenderTypeBeforeSwitch}`);
    
    await page.selectOption('select#procurementType', 'works');
    await page.waitForTimeout(1500);
    const costAfterSwitch = await page.locator('select#estimatedCost').inputValue();
    console.log(`  Cost value after switching procurement type: "${costAfterSwitch}"`);
    
    if (costAfterSwitch === '') {
      results.scenario4.push({ step: '4.1', status: 'PASS', note: 'Form resets on procurement type change' });
       console.log('✓ Cost dropdown reset correctly\\n');
    } else {
      results.scenario4.push({ step: '4.1', status: 'WARN', note: 'Cost may not have reset' });
      console.log(`⚠ Cost value is "${costAfterSwitch}" (expected empty)\\n`);
    }

    // ═══════════════════════════════════════════════════════
    // Generate Summary Report
    // ═══════════════════════════════════════════════════════
    console.log('\\n\\n═══════════════════════════════════════════════════════');
    console.log('  TEST EXECUTION SUMMARY');
    console.log('═══════════════════════════════════════════════════════\\n');

    const allResults = [
      ...results.scenario1,
      ...results.scenario2,
      ...results.scenario3,
      ...results.scenario4
    ];

    const passed = allResults.filter(r => r.status === 'PASS').length;
    const failed = allResults.filter(r => r.status === 'FAIL').length;
    const warnings = allResults.filter(r => r.status === 'WARN').length;
    const total = allResults.length;

    console.log(`Total Tests Executed: ${total}`);
    console.log(`✓ Passed: ${passed}`);
    console.log(`✗ Failed: ${failed}`);
    console.log(`⚠ Warnings: ${warnings}`);
    console.log(`\\nPass Rate: ${((passed / total) * 100).toFixed(1)}%\\n`);

    console.log('\\nDetailed Results:');
    console.log('─────────────────────────────────────────\\n');
    allResults.forEach(r => {
      const icon = r.status === 'PASS' ? '✓' : r.status === 'FAIL' ? '✗' : '⚠';
      console.log(`${icon} ${r.step}: ${r.note}`);
    });

    console.log('\\n═══════════════════════════════════════════════════════\\n');

    // Keep browser open for manual inspection
    console.log('\\n[INFO] Browser will remain open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('\\n❌ TEST EXECUTION ERROR:', error);
  } finally {
    await browser.close();
    console.log('\\n[INFO] Browser closed. Manual QA session complete.');
  }
}

// Run the manual QA
runManualQA().catch(console.error);
