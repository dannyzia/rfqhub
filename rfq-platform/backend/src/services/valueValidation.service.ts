// backend/src/services/valueValidation.service.ts
// Description: Validate tender values against tender type thresholds
// Phase 1, Task 7

import pool from '../config/database';
import logger from '../config/logger';
import * as tenderTypeService from './tenderTypeSelector.service';

export interface ValueValidationResult {
  valid: boolean;
  message?: string;
  suggestedType?: string;
  details?: {
    currentType: string;
    value: number;
    minAllowed: number;
    maxAllowed: number | null;
  };
}

/**
 * Validate if a value is appropriate for a tender type
 */
export async function validateTenderValue(
  value: number,
  tenderTypeCode: string
): Promise<ValueValidationResult> {
  try {
    // Fetch tender type definition
    const tenderType = await tenderTypeService.getTenderTypeByCode(tenderTypeCode);

    // Check if value is within range
    const isAboveMin = value >= tenderType.min_value_bdt;
    const isBelowMax = tenderType.max_value_bdt === null || value <= tenderType.max_value_bdt;

    if (isAboveMin && isBelowMax) {
      // Valid
      return {
        valid: true,
        message: `${formatBDT(value)} is valid for ${tenderTypeCode}`,
        details: {
          currentType: tenderTypeCode,
          value,
          minAllowed: tenderType.min_value_bdt,
          maxAllowed: tenderType.max_value_bdt
        }
      };
    }

    // Invalid - find suggested type
    let suggestedType = null;

    if (value < tenderType.min_value_bdt) {
      // Value too low - suggest lower type
      const lowerTypes = await pool.query(
        `SELECT * FROM tender_type_definitions
         WHERE is_active = TRUE
         AND procurement_type = $1
         AND max_value_bdt >= $2
         AND max_value_bdt < $3
         ORDER BY max_value_bdt DESC
         LIMIT 1`,
        [tenderType.procurement_type, value, tenderType.min_value_bdt]
      );

      if (lowerTypes.rows.length > 0) {
        suggestedType = lowerTypes.rows[0].code;
      }

      return {
        valid: false,
        message: `Value ${formatBDT(value)} is below minimum for ${tenderTypeCode} (minimum: ${formatBDT(
          tenderType.min_value_bdt
        )})`,
        suggestedType,
        details: {
          currentType: tenderTypeCode,
          value,
          minAllowed: tenderType.min_value_bdt,
          maxAllowed: tenderType.max_value_bdt
        }
      };
    } else {
      // Value too high - suggest higher type
      const higherTypes = await pool.query(
        `SELECT * FROM tender_type_definitions
         WHERE is_active = TRUE
         AND procurement_type = $1
         AND min_value_bdt <= $2
         AND (max_value_bdt IS NULL OR max_value_bdt > $3)
         ORDER BY min_value_bdt DESC
         LIMIT 1`,
        [tenderType.procurement_type, value, tenderType.max_value_bdt]
      );

      if (higherTypes.rows.length > 0) {
        suggestedType = higherTypes.rows[0].code;
      }

      return {
        valid: false,
        message: `Value ${formatBDT(value)} exceeds maximum for ${tenderTypeCode} (maximum: ${formatBDT(
          tenderType.max_value_bdt
        )})`,
        suggestedType,
        details: {
          currentType: tenderTypeCode,
          value,
          minAllowed: tenderType.min_value_bdt,
          maxAllowed: tenderType.max_value_bdt
        }
      };
    }
  } catch (error) {
    logger.error(`Error validating tender value: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Format BDT value as human-readable
 */
function formatBDT(value: number | null): string {
  if (value === null) return 'Unlimited';
  if (value >= 10000000) return `${(value / 10000000).toFixed(2)} Crore`;
  if (value >= 100000) return `${(value / 100000).toFixed(2)} Lac`;
  return `BDT ${value.toLocaleString('en-IN')}`;
}
