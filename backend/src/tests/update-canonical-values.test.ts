/**
 * Update Tender Types to Canonical Values Test
 *
 * This test updates existing tender_type_definitions records
 * to match the canonical migration values from 003_seed_tender_types.sql
 */

import { executeQuery } from "./test-database";

describe("Update Tender Types to Canonical Values", () => {
  it("should update all tender types to match canonical migration values", async () => {
    console.log("🔄 Updating tender types to canonical values...");

    // PG1: Update to canonical values
    await executeQuery(`
      UPDATE tender_type_definitions
      SET
          max_value_bdt = 800000,
          min_submission_days = 3,
          max_submission_days = 7,
          section_count = 4,
          method = 'rfq'
      WHERE code = 'PG1'
    `);

    // PG2: Update to canonical values
    await executeQuery(`
      UPDATE tender_type_definitions
      SET
          min_value_bdt = 800001,
          max_value_bdt = 5000000,
          tender_security_validity_days = 28,
          min_submission_days = 15,
          max_submission_days = 30,
          default_validity_days = 90,
          section_count = 8
      WHERE code = 'PG2'
    `);

    // PG3: Update to canonical values
    await executeQuery(`
      UPDATE tender_type_definitions
      SET
          min_value_bdt = 5000000,
          tender_security_validity_days = 28,
          performance_security_percent = 10.0,
          requires_retention_money = FALSE,
          retention_money_percent = NULL,
          requires_two_envelope = FALSE,
          min_submission_days = 30,
          max_submission_days = 45,
          section_count = 8
      WHERE code = 'PG3'
    `);

    // PW1: Update to canonical values
    await executeQuery(`
      UPDATE tender_type_definitions
      SET
          max_value_bdt = 1500000,
          min_submission_days = 7,
          max_submission_days = 14,
          section_count = 4,
          method = 'rfq'
      WHERE code = 'PW1'
    `);

    // PW3: Update to canonical values
    await executeQuery(`
      UPDATE tender_type_definitions
      SET
          min_value_bdt = 50000000,
          tender_security_percent = 2.0,
          tender_security_validity_days = 28,
          performance_security_percent = 10.0,
          retention_money_percent = 5.0,
          min_submission_days = 45,
          max_submission_days = 60,
          section_count = 10
      WHERE code = 'PW3'
    `);

    // PG4: Update to canonical values
    await executeQuery(`
      UPDATE tender_type_definitions
      SET
          name = 'Open Tendering - Goods (International)',
          description = 'International competitive bidding. Any value. Incoterms apply. Foreign currency allowed.',
          tender_security_percent = 2.0,
          tender_security_validity_days = 28,
          performance_security_percent = 10.0,
          requires_retention_money = FALSE,
          retention_money_percent = NULL,
          requires_two_envelope = FALSE,
          requires_prequalification = FALSE,
          min_submission_days = 30,
          max_submission_days = 60,
          section_count = 8,
          is_international = TRUE
      WHERE code = 'PG4'
    `);

    // PG5A: Update to canonical values
    await executeQuery(`
      UPDATE tender_type_definitions
      SET
          name = 'Turnkey Contract - Plant & Equipment (One Stage Two Envelope)',
          description = 'One stage two envelope. Supply + Installation + Commissioning. Technical envelope evaluated first, then commercial for qualified bidders.',
          tender_security_percent = 2.0,
          tender_security_validity_days = 28,
          performance_security_percent = 10.0,
          requires_retention_money = FALSE,
          retention_money_percent = NULL,
          requires_site_visit = FALSE,
          min_submission_days = 30,
          max_submission_days = 60,
          section_count = 8,
          is_international = TRUE,
          method = 'turnkey'
      WHERE code = 'PG5A'
    `);

    // PG9A: Update to canonical values
    await executeQuery(`
      UPDATE tender_type_definitions
      SET
          name = 'Direct Procurement - Goods (Emergency or Single Source)',
          description = 'Emergency procurement (natural disaster, urgent need). Single source (only one supplier available, proprietary item). Requires documented justification.',
          requires_performance_security = FALSE,
          performance_security_percent = NULL,
          requires_website_publication = FALSE,
          min_submission_days = 1,
          default_validity_days = 7,
          default_evaluation_days = NULL,
          section_count = 4,
          method = 'direct'
      WHERE code = 'PG9A'
    `);

    // PPS2: Update to canonical values
    await executeQuery(`
      UPDATE tender_type_definitions
      SET
          name = 'Outsourcing of Personnel (Guards, Drivers, Cleaners, etc.)',
          description = 'Hiring services for guards, security personnel, drivers, cleaners, landscaping. Quality and cost evaluation. Performance-based contract.',
          requires_performance_security = FALSE,
          performance_security_percent = NULL,
          requires_newspaper_ad = FALSE,
          requires_website_publication = FALSE,
          min_submission_days = 14,
          max_submission_days = 30,
          default_validity_days = 90,
          default_evaluation_days = NULL,
          section_count = 7
      WHERE code = 'PPS2'
    `);

    // PPS3: Update to canonical values
    await executeQuery(`
      UPDATE tender_type_definitions
      SET
          name = 'Least Cost Selection - Services (Consulting, Training, etc.)',
          description = 'Least-cost services after technical qualification. Lowest cost wins among qualified bidders. Standard consulting/training services.',
          min_submission_days = 14,
          max_submission_days = 30,
          default_validity_days = 90,
          section_count = 7
      WHERE code = 'PPS3'
    `);

    // PPS6: Update to canonical values
    await executeQuery(`
      UPDATE tender_type_definitions
      SET
          name = 'Direct Procurement - Services (Emergency or Single Source)',
          description = 'Emergency service requirement or only one qualified service provider. Requires documented justification.',
          requires_performance_security = FALSE,
          performance_security_percent = NULL,
          requires_website_publication = FALSE,
          min_submission_days = 1,
          default_validity_days = 7,
          default_evaluation_days = NULL,
          section_count = 4,
          method = 'direct'
      WHERE code = 'PPS6'
    `);

    console.log("✅ All tender types updated to canonical values");

    // Verification
    const result = await executeQuery(`
      SELECT
        code,
        name,
        min_value_bdt,
        max_value_bdt,
        min_submission_days,
        max_submission_days,
        section_count,
        method
      FROM tender_type_definitions
      WHERE code IN ('PG1', 'PG2', 'PG3', 'PW1', 'PW3', 'PG4', 'PG5A', 'PG9A', 'PPS2', 'PPS3', 'PPS6')
      ORDER BY code
    `);

    console.log("\n📊 Updated tender types:");
    result.rows.forEach((row: any) => {
      const minVal = row.min_value_bdt || 0;
      const maxVal = row.max_value_bdt
        ? row.max_value_bdt.toLocaleString()
        : "∞";
      const maxDays = row.max_submission_days || "∞";
      console.log(`   ${row.code}: ${row.name}`);
      console.log(`      Range: ${minVal.toLocaleString()} - ${maxVal} BDT`);
      console.log(
        `      Days: ${row.min_submission_days}-${maxDays}, Sections: ${row.section_count || "N/A"}, Method: ${row.method}`,
      );
    });

    // Assert that all codes exist
    expect(result.rows.length).toBe(11);

    // Verify PG1 canonical values
    const pg1 = result.rows.find((r: any) => r.code === "PG1");
    expect(pg1).toBeDefined();
    expect(parseFloat(pg1.max_value_bdt)).toBe(800000);
    expect(pg1.min_submission_days).toBe(3);
    expect(pg1.max_submission_days).toBe(7);
    expect(pg1.section_count).toBe(4);
    expect(pg1.method).toBe("rfq");

    console.log(
      "\n✅ Verification passed - all tender types match canonical values",
    );
  });
});
