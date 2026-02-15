// Test script to verify tender type selection logic works correctly

const API_URL = 'http://localhost:3001/api';
const ADMIN_TOKEN = 'test-token'; // You may need to update this

async function testTenderTypeSelection() {
  console.log('Testing Tender Type Selection Logic...\n');

  const tests = [
    {
      name: 'PG1: Goods up to 8 Lac',
      payload: { procurementType: 'goods', estimatedValue: 500000, isInternational: false },
      expectedCode: 'PG1',
    },
    {
      name: 'PG2: Goods 8-50 Lac',
      payload: { procurementType: 'goods', estimatedValue: 3000000, isInternational: false },
      expectedCode: 'PG2',
    },
    {
      name: 'PG3: Goods above 50 Lac',
      payload: { procurementType: 'goods', estimatedValue: 60000000, isInternational: false },
      expectedCode: 'PG3',
    },
    {
      name: 'PG4: International Goods',
      payload: { procurementType: 'goods', estimatedValue: 3000000, isInternational: true },
      expectedCode: 'PG4',
    },
    {
      name: 'PG5A: Turnkey',
      payload: { procurementType: 'goods', estimatedValue: 10000000, isTurnkey: true },
      expectedCode: 'PG5A',
    },
    {
      name: 'PG9A: Emergency',
      payload: { procurementType: 'goods', estimatedValue: 2000000, isEmergency: true },
      expectedCode: 'PG9A',
    },
    {
      name: 'PW1: Works up to 15 Lac',
      payload: { procurementType: 'works', estimatedValue: 1000000 },
      expectedCode: 'PW1',
    },
    {
      name: 'PW3: Works above 5 Crore',
      payload: { procurementType: 'works', estimatedValue: 60000000 },
      expectedCode: 'PW3',
    },
    {
      name: 'PPS2: Outsourcing Personnel',
      payload: { procurementType: 'services', estimatedValue: 1000000, isOutsourcingPersonnel: true },
      expectedCode: 'PPS2',
    },
    {
      name: 'PPS3: Other Services',
      payload: { procurementType: 'services', estimatedValue: 1000000 },
      expectedCode: 'PPS3',
    },
    {
      name: 'PPS6: Emergency Service',
      payload: { procurementType: 'services', estimatedValue: 1000000, isEmergency: true },
      expectedCode: 'PPS6',
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const response = await fetch(`${API_URL}/tender-types/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
        },
        body: JSON.stringify(test.payload),
      });

      if (!response.ok) {
        console.log(`❌ ${test.name}`);
        console.log(`   HTTP Status: ${response.status}`);
        failed++;
        continue;
      }

      const data = await response.json();
      const suggestions = data.data || [];

      if (suggestions.length === 0) {
        console.log(`❌ ${test.name}`);
        console.log(`   No suggestions returned`);
        failed++;
        continue;
      }

      const topSuggestion = suggestions[0];
      if (topSuggestion.code === test.expectedCode) {
        console.log(`✅ ${test.name}`);
        console.log(`   Suggested: ${topSuggestion.code} (${topSuggestion.name})`);
        typeof topSuggestion.confidence && console.log(`   Confidence: ${topSuggestion.confidence}%`);
        passed++;
      } else {
        console.log(`❌ ${test.name}`);
        console.log(`   Expected: ${test.expectedCode}`);
        console.log(`   Got: ${topSuggestion.code} (${topSuggestion.name})`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}`);
      console.log(`   Error: ${error.message}`);
      failed++;
    }
    console.log();
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
}

testTenderTypeSelection().catch(console.error);
