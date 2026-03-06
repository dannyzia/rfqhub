/**
 * Seed Missing Tender Types Test
 *
 * This test file seeds missing tender types into the test database.
 * It can be run independently to populate the database with required tender types.
 *
 * Values match canonical migration: database/migrations/003_seed_tender_types.sql
 *
 * Missing types: PG1, PG2, PG3, PW1, PW3, PG4, PG5A, PG9A, PPS2, PPS3, PPS6
 */

import { pool } from "../config/database";
import { executeQuery } from "./test-database";

const TENDER_TYPES_TO_SEED = [
  {
    code: "PG1",
    name: "Request for Quotation - Goods (up to BDT 8 Lac)",
    description:
      "RFQ pursuant to Rules 90-94 PPR 2025. For readily available off-the-shelf goods. No tender security required. Free document issuance. Splitting NOT permitted.",
    procurement_type: "goods",
    min_value_bdt: 0,
    max_value_bdt: 800000,
    requires_tender_security: false,
    tender_security_percent: null,
    tender_security_validity_days: null,
    requires_performance_security: false,
    performance_security_percent: null,
    requires_retention_money: false,
    retention_money_percent: null,
    requires_two_envelope: false,
    requires_newspaper_ad: false,
    requires_website_publication: false,
    requires_prequalification: false,
    requires_site_visit: false,
    min_submission_days: 3,
    max_submission_days: 7,
    default_validity_days: 30,
    default_evaluation_days: null,
    section_count: 4,
    is_international: false,
    is_direct_procurement: false,
    is_govt_type: true,
    is_active: true,
    method: "rfq",
    form_segment_config: {},
  },
  {
    code: "PG2",
    name: "Open/Limited Tendering - Goods (BDT 8 Lac to 50 Lac)",
    description:
      "Standard tendering for small to medium value goods. 8 sections. Tender security 2% required. Newspaper advertisement mandatory.",
    procurement_type: "goods",
    min_value_bdt: 800001,
    max_value_bdt: 5000000,
    requires_tender_security: true,
    tender_security_percent: 2.0,
    tender_security_validity_days: 28,
    requires_performance_security: true,
    performance_security_percent: 5.0,
    requires_retention_money: false,
    retention_money_percent: null,
    requires_two_envelope: false,
    requires_newspaper_ad: true,
    requires_website_publication: true,
    requires_prequalification: false,
    requires_site_visit: false,
    min_submission_days: 15,
    max_submission_days: 30,
    default_validity_days: 90,
    default_evaluation_days: null,
    section_count: 8,
    is_international: false,
    is_direct_procurement: false,
    is_govt_type: true,
    is_active: true,
    method: "open",
    form_segment_config: {},
  },
  {
    code: "PG3",
    name: "Open Tendering - Goods (above BDT 50 Lac, National)",
    description:
      "For medium to high value goods procurement. Enhanced qualification requirements. Newspaper ad required.",
    procurement_type: "goods",
    min_value_bdt: 5000000,
    max_value_bdt: null,
    requires_tender_security: true,
    tender_security_percent: 2.0,
    tender_security_validity_days: 28,
    requires_performance_security: true,
    performance_security_percent: 10.0,
    requires_retention_money: false,
    retention_money_percent: null,
    requires_two_envelope: false,
    requires_newspaper_ad: true,
    requires_website_publication: true,
    requires_prequalification: false,
    requires_site_visit: false,
    min_submission_days: 30,
    max_submission_days: 45,
    default_validity_days: 90,
    default_evaluation_days: null,
    section_count: 8,
    is_international: false,
    is_direct_procurement: false,
    is_govt_type: true,
    is_active: true,
    method: "open",
    form_segment_config: {},
  },
  {
    code: "PW1",
    name: "Request for Quotation - Works (up to BDT 15 Lac)",
    description:
      "Small works (repairs, maintenance, minor construction). No tender security. Free document issuance.",
    procurement_type: "works",
    min_value_bdt: 0,
    max_value_bdt: 1500000,
    requires_tender_security: false,
    tender_security_percent: null,
    tender_security_validity_days: null,
    requires_performance_security: false,
    performance_security_percent: null,
    requires_retention_money: false,
    retention_money_percent: null,
    requires_two_envelope: false,
    requires_newspaper_ad: false,
    requires_website_publication: false,
    requires_prequalification: false,
    requires_site_visit: false,
    min_submission_days: 7,
    max_submission_days: 14,
    default_validity_days: 30,
    default_evaluation_days: null,
    section_count: 4,
    is_international: false,
    is_direct_procurement: false,
    is_govt_type: true,
    is_active: true,
    method: "rfq",
    form_segment_config: {},
  },
  {
    code: "PW3",
    name: "Open Tendering - Works (above BDT 5 Crore)",
    description:
      "Large infrastructure projects. Two-envelope system. Pre-qualification. Site visit mandatory. Retention money required.",
    procurement_type: "works",
    min_value_bdt: 50000000,
    max_value_bdt: null,
    requires_tender_security: true,
    tender_security_percent: 2.0,
    tender_security_validity_days: 28,
    requires_performance_security: true,
    performance_security_percent: 10.0,
    requires_retention_money: true,
    retention_money_percent: 5.0,
    requires_two_envelope: true,
    requires_newspaper_ad: true,
    requires_website_publication: true,
    requires_prequalification: true,
    requires_site_visit: true,
    min_submission_days: 45,
    max_submission_days: 60,
    default_validity_days: 120,
    default_evaluation_days: null,
    section_count: 10,
    is_international: false,
    is_direct_procurement: false,
    is_govt_type: true,
    is_active: true,
    method: "open",
    form_segment_config: {},
  },
  {
    code: "PG4",
    name: "Open Tendering - Goods (International)",
    description:
      "International competitive bidding. Any value. Incoterms apply. Foreign currency allowed.",
    procurement_type: "goods",
    min_value_bdt: 0,
    max_value_bdt: null,
    requires_tender_security: true,
    tender_security_percent: 2.0,
    tender_security_validity_days: 28,
    requires_performance_security: true,
    performance_security_percent: 10.0,
    requires_retention_money: false,
    retention_money_percent: null,
    requires_two_envelope: false,
    requires_newspaper_ad: true,
    requires_website_publication: true,
    requires_prequalification: false,
    requires_site_visit: false,
    min_submission_days: 30,
    max_submission_days: 60,
    default_validity_days: 120,
    default_evaluation_days: null,
    section_count: 8,
    is_international: true,
    is_direct_procurement: false,
    is_govt_type: true,
    is_active: true,
    method: "open",
    form_segment_config: {},
  },
  {
    code: "PG5A",
    name: "Turnkey Contract - Plant & Equipment (One Stage Two Envelope)",
    description:
      "One stage two envelope. Supply + Installation + Commissioning. Technical envelope evaluated first, then commercial for qualified bidders.",
    procurement_type: "goods",
    min_value_bdt: 0,
    max_value_bdt: null,
    requires_tender_security: true,
    tender_security_percent: 2.0,
    tender_security_validity_days: 28,
    requires_performance_security: true,
    performance_security_percent: 10.0,
    requires_retention_money: false,
    retention_money_percent: null,
    requires_two_envelope: true,
    requires_newspaper_ad: true,
    requires_website_publication: true,
    requires_prequalification: true,
    requires_site_visit: false,
    min_submission_days: 30,
    max_submission_days: 60,
    default_validity_days: 120,
    default_evaluation_days: null,
    section_count: 8,
    is_international: true,
    is_direct_procurement: false,
    is_govt_type: true,
    is_active: true,
    method: "turnkey",
    form_segment_config: {},
  },
  {
    code: "PG9A",
    name: "Direct Procurement - Goods (Emergency or Single Source)",
    description:
      "Emergency procurement (natural disaster, urgent need). Single source (only one supplier available, proprietary item). Requires documented justification.",
    procurement_type: "goods",
    min_value_bdt: 0,
    max_value_bdt: null,
    requires_tender_security: false,
    tender_security_percent: null,
    tender_security_validity_days: null,
    requires_performance_security: false,
    performance_security_percent: null,
    requires_retention_money: false,
    retention_money_percent: null,
    requires_two_envelope: false,
    requires_newspaper_ad: false,
    requires_website_publication: false,
    requires_prequalification: false,
    requires_site_visit: false,
    min_submission_days: 1,
    max_submission_days: null,
    default_validity_days: 7,
    default_evaluation_days: null,
    section_count: 4,
    is_international: false,
    is_direct_procurement: true,
    is_govt_type: true,
    is_active: true,
    method: "direct",
    form_segment_config: {},
  },
  {
    code: "PPS2",
    name: "Outsourcing of Personnel (Guards, Drivers, Cleaners, etc.)",
    description:
      "Hiring services for guards, security personnel, drivers, cleaners, landscaping. Quality and cost evaluation. Performance-based contract.",
    procurement_type: "services",
    min_value_bdt: 0,
    max_value_bdt: null,
    requires_tender_security: false,
    tender_security_percent: null,
    tender_security_validity_days: null,
    requires_performance_security: false,
    performance_security_percent: null,
    requires_retention_money: false,
    retention_money_percent: null,
    requires_two_envelope: false,
    requires_newspaper_ad: false,
    requires_website_publication: false,
    requires_prequalification: false,
    requires_site_visit: false,
    min_submission_days: 14,
    max_submission_days: 30,
    default_validity_days: 90,
    default_evaluation_days: null,
    section_count: 7,
    is_international: false,
    is_direct_procurement: false,
    is_govt_type: true,
    is_active: true,
    method: "open",
    form_segment_config: {},
  },
  {
    code: "PPS3",
    name: "Least Cost Selection - Services (Consulting, Training, etc.)",
    description:
      "Least-cost services after technical qualification. Lowest cost wins among qualified bidders. Standard consulting/training services.",
    procurement_type: "services",
    min_value_bdt: 0,
    max_value_bdt: null,
    requires_tender_security: false,
    tender_security_percent: null,
    tender_security_validity_days: null,
    requires_performance_security: false,
    performance_security_percent: null,
    requires_retention_money: false,
    retention_money_percent: null,
    requires_two_envelope: false,
    requires_newspaper_ad: false,
    requires_website_publication: false,
    requires_prequalification: false,
    requires_site_visit: false,
    min_submission_days: 14,
    max_submission_days: 30,
    default_validity_days: 90,
    default_evaluation_days: null,
    section_count: 7,
    is_international: false,
    is_direct_procurement: false,
    is_govt_type: true,
    is_active: true,
    method: "open",
    form_segment_config: {},
  },
  {
    code: "PPS6",
    name: "Direct Procurement - Services (Emergency or Single Source)",
    description:
      "Emergency service requirement or only one qualified service provider. Requires documented justification.",
    procurement_type: "services",
    min_value_bdt: 0,
    max_value_bdt: null,
    requires_tender_security: false,
    tender_security_percent: null,
    tender_security_validity_days: null,
    requires_performance_security: false,
    performance_security_percent: null,
    requires_retention_money: false,
    retention_money_percent: null,
    requires_two_envelope: false,
    requires_newspaper_ad: false,
    requires_website_publication: false,
    requires_prequalification: false,
    requires_site_visit: false,
    min_submission_days: 1,
    max_submission_days: null,
    default_validity_days: 7,
    default_evaluation_days: null,
    section_count: 4,
    is_international: false,
    is_direct_procurement: true,
    is_govt_type: true,
    is_active: true,
    method: "direct",
    form_segment_config: {},
  },
];

/**
 * Main seeding function - can be called independently
 */
export async function seedMissingTenderTypes() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    console.log("🔍 Checking existing tender types...");
    const existingResult = await client.query(
      "SELECT code, name FROM tender_type_definitions ORDER BY code",
    );
    const existingCodes = new Set(
      existingResult.rows.map((row: any) => row.code),
    );

    console.log(`✅ Found ${existingCodes.size} existing tender types:`);
    existingResult.rows.forEach((row: any) => {
      console.log(`   - ${row.code}: ${row.name}`);
    });

    const missingTypes = TENDER_TYPES_TO_SEED.filter(
      (type) => !existingCodes.has(type.code),
    );

    if (missingTypes.length === 0) {
      console.log("✅ All required tender types already exist in database.");
      await client.query("ROLLBACK");
      return { seeded: 0, alreadyExists: TENDER_TYPES_TO_SEED.length };
    }

    console.log(`\n📝 Seeding ${missingTypes.length} missing tender types...`);

    for (const type of missingTypes) {
      const columns = Object.keys(type).join(", ");
      const placeholders = Object.keys(type)
        .map((_, i) => `$${i + 1}`)
        .join(", ");
      const values = Object.values(type);

      await client.query(
        `INSERT INTO tender_type_definitions (${columns}) VALUES (${placeholders})`,
        values,
      );

      console.log(`   ✅ Inserted ${type.code}: ${type.name}`);
    }

    await client.query("COMMIT");

    console.log("\n✅ Successfully seeded missing tender types!");

    // Verify insertions
    const verifyResult = await client.query(
      "SELECT code, name FROM tender_type_definitions WHERE code = ANY($1) ORDER BY code",
      [missingTypes.map((t) => t.code)],
    );

    console.log("\n📊 Verification - Tender types now in database:");
    verifyResult.rows.forEach((row: any) => {
      console.log(`   - ${row.code}: ${row.name}`);
    });

    return {
      seeded: missingTypes.length,
      alreadyExists: TENDER_TYPES_TO_SEED.length - missingTypes.length,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error seeding tender types:", error);
    throw error;
  } finally {
    client.release();
  }
}

describe("Seed Missing Tender Types", () => {
  /**
   * Test to verify seeding works correctly
   */
  it("should seed missing tender types (PG1, PG2, PG3, PW1, PW3, PG4, PG5A, PG9A, PPS2, PPS3, PPS6) into database", async () => {
    const result = await seedMissingTenderTypes();

    // Verify all required tender types exist in database
    const requiredCodes = [
      "PG1",
      "PG2",
      "PG3",
      "PW1",
      "PW3",
      "PG4",
      "PG5A",
      "PG9A",
      "PPS2",
      "PPS3",
      "PPS6",
    ];

    for (const code of requiredCodes) {
      const tenderType = await executeQuery(
        "SELECT * FROM tender_type_definitions WHERE code = $1",
        [code],
      );

      expect(tenderType.rows.length).toBeGreaterThan(0);
      expect(tenderType.rows[0].code).toBe(code);
      expect(tenderType.rows[0].is_active).toBe(true);
    }

    console.log(
      `\n✅ Seeding test passed: ${result.seeded} seeded, ${result.alreadyExists} already existed`,
    );
  });

  /**
   * Test to verify idempotency - can be run multiple times without duplicates
   */
  it("should be idempotent - running multiple times does not create duplicates", async () => {
    // Run seeding twice
    await seedMissingTenderTypes();
    const result2 = await seedMissingTenderTypes();

    // Second run should report 0 new seedings
    expect(result2.seeded).toBe(0);

    // Verify no duplicates exist
    const duplicateCheck = await executeQuery(
      `
      SELECT code, COUNT(*) as count
      FROM tender_type_definitions
      WHERE code = ANY($1)
      GROUP BY code
      HAVING COUNT(*) > 1
    `,
      [
        [
          "PG1",
          "PG2",
          "PG3",
          "PW1",
          "PW3",
          "PG4",
          "PG5A",
          "PG9A",
          "PPS2",
          "PPS3",
          "PPS6",
        ],
      ],
    );

    expect(duplicateCheck.rows.length).toBe(0);

    console.log("✅ Idempotency test passed - no duplicates created");
  });
});
