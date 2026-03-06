/**
 * Canonical mock tender type definitions for unit tests.
 *
 * These represent the Bangladesh PPRA e-GP tender type codes that are expected
 * to exist in the `tender_type_definitions` table. Tests that rely on this
 * service data should import this fixture and use setupTenderTypePoolMock()
 * instead of hitting a real database.
 *
 * Values are aligned with both tenderTypeSelector.service tests AND
 * securityCalculation.service tests.
 */

export interface MockTenderType {
  code: string;
  name: string;
  description: string;
  procurement_type: string;
  min_value_bdt: number;
  max_value_bdt: number | null;
  requires_tender_security: boolean;
  tender_security_percent: number | null;
  requires_performance_security: boolean;
  performance_security_percent: number | null;
  requires_retention_money: boolean;
  retention_money_percent: number | null;
  requires_two_envelope: boolean;
  requires_newspaper_ad: boolean;
  requires_prequalification: boolean;
  min_submission_days: number;
  max_submission_days: number | null;
  default_validity_days: number;
  section_count: number;
  is_international: boolean;
  is_direct_procurement: boolean;
  is_active: boolean;
  is_govt_type: boolean;
}

/**
 * Canonical tender type data.
 * Covers: goods (normal + special), works, services (normal + special).
 * Total: 14 types (> 10, required by listTenderTypes() test).
 */
export const MOCK_TENDER_TYPES: Record<string, MockTenderType> = {
  // ── GOODS ── normal value-based (is_govt_type=true) ──────────────────────
  PG1: {
    code: "PG1",
    name: "Goods Procurement (Up to 8 Lac)",
    description: "Small value goods procurement via quotation",
    procurement_type: "goods",
    min_value_bdt: 0,
    max_value_bdt: 800000,
    requires_tender_security: false,
    tender_security_percent: null,
    requires_performance_security: false,
    performance_security_percent: null,
    requires_retention_money: false,
    retention_money_percent: null,
    requires_two_envelope: false,
    requires_newspaper_ad: false,
    requires_prequalification: false,
    min_submission_days: 14,
    max_submission_days: 28,
    default_validity_days: 90,
    section_count: 4,
    is_international: false,
    is_direct_procurement: false,
    is_active: true,
    is_govt_type: true,
  },
  PG2: {
    code: "PG2",
    name: "Goods Procurement (8 Lac – 50 Lac)",
    description: "Medium value goods procurement via open tender",
    procurement_type: "goods",
    min_value_bdt: 800001,
    max_value_bdt: 5000000,
    requires_tender_security: true,
    tender_security_percent: 2,
    requires_performance_security: true,
    // NOTE: performance_security_percent = 5 (not 10) — aligned with
    // securityCalculation.service.test.ts expectations.
    performance_security_percent: 5,
    requires_retention_money: false,
    retention_money_percent: null,
    requires_two_envelope: false,
    requires_newspaper_ad: true,
    requires_prequalification: false,
    min_submission_days: 21,
    max_submission_days: 42,
    default_validity_days: 120,
    section_count: 5,
    is_international: false,
    is_direct_procurement: false,
    is_active: true,
    is_govt_type: true,
  },
  PG3: {
    code: "PG3",
    name: "Goods Procurement (50 Lac – 3 Crore)",
    description: "Large value goods procurement via open tender",
    procurement_type: "goods",
    min_value_bdt: 5000001,
    max_value_bdt: 30000000,
    requires_tender_security: true,
    tender_security_percent: 2,
    requires_performance_security: true,
    performance_security_percent: 5,
    requires_retention_money: false,
    retention_money_percent: null,
    requires_two_envelope: false,
    requires_newspaper_ad: true,
    requires_prequalification: false,
    min_submission_days: 28,
    max_submission_days: 56,
    default_validity_days: 180,
    section_count: 6,
    is_international: false,
    is_direct_procurement: false,
    is_active: true,
    is_govt_type: true,
  },
  PG6: {
    code: "PG6",
    name: "Goods Procurement (Above 3 Crore)",
    description: "Very large value goods procurement — two-envelope system",
    procurement_type: "goods",
    min_value_bdt: 30000001,
    max_value_bdt: null,
    requires_tender_security: true,
    tender_security_percent: 2,
    requires_performance_security: true,
    performance_security_percent: 5,
    requires_retention_money: false,
    retention_money_percent: null,
    requires_two_envelope: true,
    requires_newspaper_ad: true,
    requires_prequalification: true,
    min_submission_days: 42,
    max_submission_days: null,
    default_validity_days: 180,
    section_count: 8,
    is_international: false,
    is_direct_procurement: false,
    is_active: true,
    is_govt_type: true,
  },
  // ── GOODS ── special cases ───────────────────────────────────────────────
  PG4: {
    code: "PG4",
    name: "International Competitive Bidding – Goods",
    description: "International procurement of goods",
    procurement_type: "goods",
    min_value_bdt: 0,
    max_value_bdt: null,
    requires_tender_security: true,
    tender_security_percent: 2,
    requires_performance_security: true,
    performance_security_percent: 10,
    requires_retention_money: false,
    retention_money_percent: null,
    requires_two_envelope: false,
    requires_newspaper_ad: true,
    requires_prequalification: false,
    min_submission_days: 42,
    max_submission_days: null,
    default_validity_days: 180,
    section_count: 6,
    is_international: true,
    is_direct_procurement: false,
    is_active: true,
    is_govt_type: true,
  },
  PG5A: {
    code: "PG5A",
    name: "Turnkey Contract – Supply + Install + Commission",
    description: "Turnkey goods procurement with installation and commissioning",
    procurement_type: "goods",
    min_value_bdt: 0,
    max_value_bdt: null,
    requires_tender_security: true,
    tender_security_percent: 2,
    requires_performance_security: true,
    performance_security_percent: 10,
    requires_retention_money: false,
    retention_money_percent: null,
    requires_two_envelope: true,
    requires_newspaper_ad: true,
    requires_prequalification: false,
    min_submission_days: 28,
    max_submission_days: null,
    default_validity_days: 180,
    section_count: 7,
    is_international: false,
    is_direct_procurement: false,
    is_active: true,
    is_govt_type: true,
  },
  PG9A: {
    code: "PG9A",
    name: "Emergency / Single Source Procurement – Goods",
    description: "Direct emergency or single-source procurement of goods",
    procurement_type: "goods",
    min_value_bdt: 0,
    max_value_bdt: null,
    requires_tender_security: false,
    tender_security_percent: null,
    requires_performance_security: false,
    performance_security_percent: null,
    requires_retention_money: false,
    retention_money_percent: null,
    requires_two_envelope: false,
    requires_newspaper_ad: false,
    requires_prequalification: false,
    min_submission_days: 0,
    max_submission_days: null,
    default_validity_days: 30,
    section_count: 2,
    is_international: false,
    is_direct_procurement: true,
    is_active: true,
    is_govt_type: true,
  },
  // ── WORKS ──────────────────────────────────────────────────────────────
  PW1: {
    code: "PW1",
    name: "Works Procurement (Up to 15 Lac)",
    description: "Small value works procurement via open tender",
    procurement_type: "works",
    min_value_bdt: 0,
    max_value_bdt: 1500000,
    requires_tender_security: false,
    tender_security_percent: null,
    requires_performance_security: true,
    performance_security_percent: 10,
    requires_retention_money: true,
    retention_money_percent: 5,
    requires_two_envelope: false,
    requires_newspaper_ad: false,
    requires_prequalification: false,
    min_submission_days: 21,
    max_submission_days: 28,
    default_validity_days: 90,
    section_count: 4,
    is_international: false,
    is_direct_procurement: false,
    is_active: true,
    is_govt_type: true,
  },
  PW2: {
    code: "PW2",
    name: "Works Procurement (15 Lac – 3 Crore)",
    description: "Medium value works procurement via open tender",
    procurement_type: "works",
    min_value_bdt: 1500001,
    max_value_bdt: 30000000,
    requires_tender_security: true,
    tender_security_percent: 2,
    requires_performance_security: true,
    performance_security_percent: 10,
    requires_retention_money: true,
    retention_money_percent: 5,
    requires_two_envelope: false,
    requires_newspaper_ad: true,
    requires_prequalification: false,
    min_submission_days: 28,
    max_submission_days: 42,
    default_validity_days: 120,
    section_count: 5,
    is_international: false,
    is_direct_procurement: false,
    is_active: true,
    is_govt_type: true,
  },
  PW3: {
    code: "PW3",
    name: "Works Procurement (Above 3 Crore)",
    description: "Large value works procurement via open tender",
    procurement_type: "works",
    min_value_bdt: 30000001,
    max_value_bdt: null,
    requires_tender_security: true,
    tender_security_percent: 2,
    requires_performance_security: true,
    performance_security_percent: 10,
    requires_retention_money: true,
    retention_money_percent: 5,
    requires_two_envelope: true,
    requires_newspaper_ad: true,
    requires_prequalification: true,
    min_submission_days: 42,
    max_submission_days: null,
    default_validity_days: 180,
    section_count: 8,
    is_international: false,
    is_direct_procurement: false,
    is_active: true,
    is_govt_type: true,
  },
  // ── SERVICES ── normal ──────────────────────────────────────────────────
  PPS1: {
    code: "PPS1",
    name: "Services Procurement (Up to 10 Lac)",
    description: "Small value intellectual/professional services",
    procurement_type: "services",
    min_value_bdt: 0,
    max_value_bdt: 1000000,
    requires_tender_security: false,
    tender_security_percent: null,
    requires_performance_security: false,
    performance_security_percent: null,
    requires_retention_money: false,
    retention_money_percent: null,
    requires_two_envelope: false,
    requires_newspaper_ad: false,
    requires_prequalification: false,
    min_submission_days: 14,
    max_submission_days: 28,
    default_validity_days: 90,
    section_count: 4,
    is_international: false,
    is_direct_procurement: false,
    is_active: true,
    is_govt_type: true,
  },
  PPS3: {
    code: "PPS3",
    name: "Services Procurement (Above 10 Lac)",
    description: "Large value intellectual/professional services",
    procurement_type: "services",
    min_value_bdt: 1000001,
    max_value_bdt: null,
    requires_tender_security: true,
    tender_security_percent: 2,
    requires_performance_security: true,
    performance_security_percent: 5,
    requires_retention_money: false,
    retention_money_percent: null,
    requires_two_envelope: false,
    requires_newspaper_ad: true,
    requires_prequalification: false,
    min_submission_days: 21,
    max_submission_days: null,
    default_validity_days: 120,
    section_count: 5,
    is_international: false,
    is_direct_procurement: false,
    is_active: true,
    is_govt_type: true,
  },
  // ── SERVICES ── special ─────────────────────────────────────────────────
  PPS2: {
    code: "PPS2",
    name: "Outsourcing of Personnel (Guards, Drivers, Cleaners, etc.)",
    description: "Personnel outsourcing services",
    procurement_type: "services",
    min_value_bdt: 0,
    max_value_bdt: null,
    requires_tender_security: false,
    tender_security_percent: null,
    requires_performance_security: false,
    performance_security_percent: null,
    requires_retention_money: false,
    retention_money_percent: null,
    requires_two_envelope: false,
    requires_newspaper_ad: false,
    requires_prequalification: false,
    min_submission_days: 14,
    max_submission_days: null,
    default_validity_days: 90,
    section_count: 3,
    is_international: false,
    is_direct_procurement: false,
    is_active: true,
    is_govt_type: true,
  },
  PPS6: {
    code: "PPS6",
    name: "Emergency / Single Source – Services",
    description: "Direct emergency or single-source procurement of services",
    procurement_type: "services",
    min_value_bdt: 0,
    max_value_bdt: null,
    requires_tender_security: false,
    tender_security_percent: null,
    requires_performance_security: false,
    performance_security_percent: null,
    requires_retention_money: false,
    retention_money_percent: null,
    requires_two_envelope: false,
    requires_newspaper_ad: false,
    requires_prequalification: false,
    min_submission_days: 0,
    max_submission_days: null,
    default_validity_days: 30,
    section_count: 2,
    is_international: false,
    is_direct_procurement: true,
    is_active: true,
    is_govt_type: true,
  },
};

/**
 * All types as a flat array (convenience accessor).
 */
export const ALL_MOCK_TYPES: MockTenderType[] = Object.values(MOCK_TENDER_TYPES);

/**
 * Build a Jest mock implementation for pool.query that serves data from
 * MOCK_TENDER_TYPES.  Handles all SQL patterns used by tenderTypeSelector.service.ts.
 *
 * Usage in test:
 *
 *   jest.mock("../../config/database");
 *
 *   beforeEach(() => {
 *     const pool = require("../../config/database").default;
 *     pool.query.mockImplementation(buildTenderTypeQueryMock());
 *   });
 */
export function buildTenderTypeQueryMock() {
  return (sql: string, params?: any[]) => {
    const p = params || [];

    // ── 1. Single-type lookup by code ────────────────────────────────────
    if (/WHERE code = \$1/.test(sql)) {
      const code = p[0] as string;
      const found = ALL_MOCK_TYPES.filter((t) => t.code === code && t.is_active);
      return Promise.resolve({ rows: found });
    }

    // ── 2. General tender_type_definitions list/suggest queries ──────────
    if (!sql.includes("tender_type_definitions")) {
      return Promise.resolve({ rows: [] });
    }

    let rows = ALL_MOCK_TYPES.filter((t) => t.is_active);

    // Filter: is_direct_procurement IS NOT TRUE
    if (/is_direct_procurement IS NOT TRUE/.test(sql)) {
      rows = rows.filter((t) => !t.is_direct_procurement);
    }

    // Filter: code NOT IN ('PG4', 'PG5A', 'PPS2')
    if (/code NOT IN/.test(sql)) {
      rows = rows.filter((t) => !["PG4", "PG5A", "PPS2"].includes(t.code));
    }

    // ── Param-based filters ──────────────────────────────────────────────
    // Normal suggest query: procurement_type = $1, is_govt_type = $2
    if (/procurement_type = \$1/.test(sql) && /is_govt_type = \$2/.test(sql)) {
      const procType = p[0] as string;
      const isGovt = p[1] as boolean;
      rows = rows.filter(
        (t) => t.procurement_type === procType && t.is_govt_type === isGovt,
      );
    }
    // listTenderTypes: is_govt_type = $1, procurement_type = $2
    else if (/is_govt_type = \$1/.test(sql) && /procurement_type = \$2/.test(sql)) {
      const isGovt = p[0] as boolean;
      const procType = p[1] as string;
      rows = rows.filter(
        (t) => t.is_govt_type === isGovt && t.procurement_type === procType,
      );
    }
    // listTenderTypes: is_govt_type = $1 only (no procurement_type filter)
    else if (/is_govt_type = \$1/.test(sql) && !/procurement_type/.test(sql)) {
      const isGovt = p[0] as boolean;
      rows = rows.filter((t) => t.is_govt_type === isGovt);
    }
    // listTenderTypes: procurement_type = $1 only (no is_govt_type filter)
    else if (!/is_govt_type/.test(sql) && /procurement_type = \$1/.test(sql)) {
      const procType = p[0] as string;
      rows = rows.filter((t) => t.procurement_type === procType);
    }
    // No param-based filters → return all active rows

    return Promise.resolve({ rows });
  };
}
