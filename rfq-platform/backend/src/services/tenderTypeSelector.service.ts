// backend/src/services/tenderTypeSelector.service.ts
// Description: Intelligent tender type suggestion based on procurement parameters
// Phase 1, Task 6

import pool from '../config/database';
import { redisClient } from '../config/redis';
import { OrganizationType } from '../types/organization.types';

const CACHE_TTL = 86400; // 24 hours
const CACHE_PREFIX = 'tender_type:';

export interface TenderTypeSelectorInput {
  procurementType: 'goods' | 'works' | 'services';
  estimatedValue: number;
  currency?: string;
  isInternational?: boolean;
  isEmergency?: boolean;
  isSingleSource?: boolean;
  isTurnkey?: boolean;
  isOutsourcingPersonnel?: boolean;
  organizationType?: OrganizationType;  // NEW parameter
}

export interface TenderTypeSuggestion {
  code: string;
  name: string;
  confidence: number; // 0-100
  reasons: string[];
  warnings?: string[];
  metadata: {
    minValue: number | null;
    maxValue: number | null;
    requiresTenderSecurity: boolean;
    tenderSecurityPercent: number | null;
    minSubmissionDays: number;
    sectionCount: number;
  };
}

export interface TenderTypeDefinition {
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
}

/**
 * List all available tender types
 */
export async function listTenderTypes(
  procurementType?: string,
  organizationType?: OrganizationType  // NEW parameter
): Promise<TenderTypeDefinition[]> {
  try {
    const cacheKey = `${CACHE_PREFIX}list:${procurementType || 'all'}:${organizationType || 'all'}`;

    // Try to get from cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Cache miss - query database
    let query = 'SELECT * FROM tender_type_definitions WHERE is_active = TRUE';
    const params: any[] = [];
    let paramCount = 1;

    // Filter by organization type
    if (organizationType) {
      const isGovt = organizationType === OrganizationType.Government;
      query += ` AND is_govt_type = $${paramCount}`;
      params.push(isGovt);
      paramCount++;
    }

    // Filter by procurement type
    if (procurementType) {
      query += ` AND procurement_type = $${paramCount}`;
      params.push(procurementType);
      paramCount++;
    }

    query += ' ORDER BY code ASC';

    const result = await pool.query(query, params);
    const types = result.rows;

    // Store in cache
    await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(types));

    return types;
  } catch (error) {
    throw error;
  }
}

/**
 * Get tender type by code
 */
export async function getTenderTypeByCode(code: string): Promise<TenderTypeDefinition> {
  try {
    const cacheKey = `${CACHE_PREFIX}code:${code}`;

    // Try to get from cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Cache miss - query database
    const result = await pool.query(
      'SELECT * FROM tender_type_definitions WHERE code = $1 AND is_active = TRUE',
      [code]
    );

    if (result.rows.length === 0) {
      throw Object.assign(new Error(`Tender type not found: ${code}`), {
        statusCode: 404,
        code: 'TENDER_TYPE_NOT_FOUND'
      });
    }

    const type = result.rows[0];

    // Store in cache
    await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(type));

    return type;
  } catch (error) {
    throw error;
  }
}

/**
 * Suggest tender types based on procurement parameters
 * Follows Bangladesh e-GP Decision Tree:
 * 1. Check special cases (emergency, international, single source, turnkey, outsourcing)
 * 2. Get all active tender types for procurement type
 * 3. Filter by value range (excluding unlimited types unless applicable)
 * 4. Calculate confidence scores
 * 5. Return best matching suggestions (sorted by confidence)
 */
export async function suggestTenderType(
  input: TenderTypeSelectorInput
): Promise<TenderTypeSuggestion[]> {
  try {
    const suggestions: TenderTypeSuggestion[] = [];

    // ========================================================================
    // SPECIAL CASE: EMERGENCY OR SINGLE SOURCE
    // ========================================================================
    if (input.isEmergency || input.isSingleSource) {
      if (input.procurementType === 'goods') {
        const pg9a = await getTenderTypeByCode('PG9A');
        suggestions.push({
          code: pg9a.code,
          name: pg9a.name,
          confidence: 100,
          reasons: [
            input.isEmergency ? 'Emergency procurement requirement' : 'Single source (only one supplier)',
            'Direct procurement applicable',
            'Justification required'
          ],
          metadata: mapToMetadata(pg9a)
        });
      } else if (input.procurementType === 'services') {
        const pps6 = await getTenderTypeByCode('PPS6');
        suggestions.push({
          code: pps6.code,
          name: pps6.name,
          confidence: 100,
          reasons: [
            input.isEmergency ? 'Emergency service requirement' : 'Single source (only one provider)',
            'Direct procurement applicable',
            'Justification required'
          ],
          metadata: mapToMetadata(pps6)
        });
      } else if (input.procurementType === 'works') {
        // Note: Works does not have a specific direct procurement code
        // Falling through to normal logic which will suggest PW1 or PW3 based on value
        // The justification would be added to the tender as a note
      }
      if (suggestions.length > 0) return suggestions;
    }

    // ========================================================================
    // SPECIAL CASE: OUTSOURCING PERSONNEL (SERVICES ONLY)
    // ========================================================================
    if (input.isOutsourcingPersonnel && input.procurementType === 'services') {
      const pps2 = await getTenderTypeByCode('PPS2');
      suggestions.push({
        code: pps2.code,
        name: pps2.name,
        confidence: 100,
        reasons: [
          'Personnel outsourcing (guards, drivers, cleaners, landscapers, etc.)',
          'Specialized outsourcing selection method'
        ],
        metadata: mapToMetadata(pps2)
      });
      return suggestions;
    }

    // ========================================================================
    // SPECIAL CASE: TURNKEY CONTRACT (GOODS ONLY)
    // ========================================================================
    if (input.isTurnkey && input.procurementType === 'goods') {
      const pg5a = await getTenderTypeByCode('PG5A');
      suggestions.push({
        code: pg5a.code,
        name: pg5a.name,
        confidence: 100,
        reasons: [
          'Turnkey contract (Supply + Installation + Commissioning)',
          'One-stage two-envelope system',
          'Mandatory site visit and pre-bid meeting'
        ],
        metadata: mapToMetadata(pg5a)
      });
      return suggestions;
    }

    // ========================================================================
    // SPECIAL CASE: INTERNATIONAL PROCUREMENT (GOODS ONLY)
    // ========================================================================
    if (input.isInternational && input.procurementType === 'goods') {
      const pg4 = await getTenderTypeByCode('PG4');
      suggestions.push({
        code: pg4.code,
        name: pg4.name,
        confidence: 100,
        reasons: [
          'International competitive bidding required',
          'Foreign bidders and currency allowed',
          'Any value - international scope'
        ],
        metadata: mapToMetadata(pg4)
      });
      return suggestions;
    }

    // ========================================================================
    // NORMAL CASE: FOLLOW VALUE-BASED DECISION TREE
    // ========================================================================
    // Get all tender types for this procurement type, excluding direct procurement and special types
    // Filter by organization type
    const isGovt = input.organizationType === OrganizationType.Government;
    const query = `
      SELECT * FROM tender_type_definitions 
      WHERE is_active = TRUE 
        AND procurement_type = $1
        AND is_direct_procurement IS NOT TRUE
        AND is_govt_type = $2  -- NEW filter
        AND code NOT IN ('PG4', 'PG5A', 'PPS2')
      ORDER BY code ASC
    `;

    const allTypes = await pool.query(query, [input.procurementType, isGovt]);

    // Filter types by value range (strict filtering based on min_value_bdt and max_value_bdt)
    const candidateTypes = allTypes.rows
      .filter((type: TenderTypeDefinition) => {
        // Value must be >= min AND <= max (if max is defined)
        const meetsMin = input.estimatedValue >= type.min_value_bdt;
        const meetsMax = type.max_value_bdt === null || input.estimatedValue <= type.max_value_bdt;
        return meetsMin && meetsMax;
      })
      .map((type: TenderTypeDefinition) => {
        const suggestion = scoreTenderType(type);
        return suggestion;
      });

    // Sort by confidence (highest first)
    const sorted = candidateTypes.sort((a, b) => b.confidence - a.confidence);

    // Return all matching suggestions
    // For value-based decisions, there should be exactly 1 match due to non-overlapping ranges
    return sorted;
  } catch (error) {
    throw error;
  }
}

/**
 * Score a tender type based on input parameters
 * Used only for value-based selection (special cases handled separately)
 */
function scoreTenderType(type: TenderTypeDefinition): TenderTypeSuggestion {
  let confidence = 100;
  const reasons: string[] = [];
  const warnings: string[] = [];

  // Primary reason: Value fits range
  const formattedMin = formatBDT(type.min_value_bdt);
  const formattedMax = type.max_value_bdt ? formatBDT(type.max_value_bdt) : 'Unlimited';
  reasons.push(`Value fits ${formattedMin} - ${formattedMax}`);

  // Add key requirements to reasons
  if (!type.requires_tender_security) {
    reasons.push('No tender security required');
  } else if (type.tender_security_percent) {
    reasons.push(`Tender security: ${type.tender_security_percent}%`);
  }

  // Add process requirements
  if (type.requires_two_envelope) {
    reasons.push('Two-envelope system (Technical + Commercial)');
  }

  if (type.requires_newspaper_ad) {
    reasons.push('Newspaper advertisement required');
  }

  // Minimum submission days
  reasons.push(`Minimum ${type.min_submission_days} days submission time`);

  // Note: We shouldn't penalize here for international/turnkey/etc
  // because those special cases are handled before this function is called
  // This function is only for scoring normal value-based tenders

  // Ensure confidence is 0-100
  confidence = Math.max(0, Math.min(100, confidence));

  return {
    code: type.code,
    name: type.name,
    confidence,
    reasons,
    warnings: warnings.length > 0 ? warnings : undefined,
    metadata: mapToMetadata(type)
  };
}

/**
 * Map database row to metadata object
 */
function mapToMetadata(type: TenderTypeDefinition) {
  return {
    minValue: type.min_value_bdt,
    maxValue: type.max_value_bdt,
    requiresTenderSecurity: type.requires_tender_security,
    tenderSecurityPercent: type.tender_security_percent,
    minSubmissionDays: type.min_submission_days,
    sectionCount: type.section_count || 0
  };
}

/**
 * Format BDT value as human-readable (Lac/Crore)
 */
function formatBDT(value: number | null): string {
  if (value === null) return 'Unlimited';
  if (value >= 10000000) return `${(value / 10000000).toFixed(2)} Crore`;
  if (value >= 100000) return `${(value / 100000).toFixed(2)} Lac`;
  return `BDT ${value.toLocaleString('en-IN')}`;
}

/**
 * Value Range Group for dropdown options
 */
export interface ValueRangeGroup {
  label: string;
  minValue: number;
  maxValue: number | null;
  suggestedTypes: string[];
}

/**
 * Get value ranges for procurement type for dropdown filtering
 * Returns grouped value ranges with suggested tender types for each range
 */
export async function getValueRangesForProcurementType(
  procurementType: 'goods' | 'works' | 'services',
  organizationType?: OrganizationType  // NEW parameter
): Promise<{
  procurementType: string;
  ranges: ValueRangeGroup[];
  specialCases: Record<string, { available: boolean; type?: string }>;
}> {
  try {
    // Get all active types for this procurement type
    const types = await listTenderTypes(procurementType, organizationType);

    // Filter out special types as they're handled separately
    const normalTypes = types.filter(
      (t) => !t.is_direct_procurement && !t.is_international && !['PG4', 'PG5A', 'PPS2'].includes(t.code)
    );

    // Sort by min_value_bdt to build sequential ranges
    const sorted = normalTypes.sort((a, b) => a.min_value_bdt - b.min_value_bdt);

    // Build ranges from consecutive tender types
    const ranges: ValueRangeGroup[] = sorted.map((type) => {
      const label = buildRangeLabel(type);
      return {
        label,
        minValue: Number(type.min_value_bdt),
        maxValue: type.max_value_bdt ? Number(type.max_value_bdt) : null,
        suggestedTypes: [type.code]
      };
    });

    // Special cases per procurement type
    const specialCases: Record<string, { available: boolean; type?: string }> = {};

    if (procurementType === 'goods') {
      specialCases['international'] = { available: true, type: 'PG4' };
      specialCases['turnkey'] = { available: true, type: 'PG5A' };
      specialCases['emergency'] = { available: true, type: 'PG9A' };
      specialCases['singleSource'] = { available: true, type: 'PG9A' };
    } else if (procurementType === 'services') {
      specialCases['outsourcingPersonnel'] = { available: true, type: 'PPS2' };
      specialCases['emergency'] = { available: true, type: 'PPS6' };
      specialCases['singleSource'] = { available: true, type: 'PPS6' };
    } else if (procurementType === 'works') {
      specialCases['emergency'] = { available: true };
      specialCases['singleSource'] = { available: true };
    }

    return {
      procurementType,
      ranges,
      specialCases
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Build human-readable label for a value range
 */
function buildRangeLabel(type: TenderTypeDefinition): string {
  const minFormatted = formatBDT(type.min_value_bdt);
  const maxFormatted = type.max_value_bdt ? formatBDT(type.max_value_bdt) : 'Unlimited';

  return type.max_value_bdt
    ? `${minFormatted} - ${maxFormatted} (${type.code})`
    : `${minFormatted} and above (${type.code})`;
}
