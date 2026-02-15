// backend/src/services/securityCalculation.service.ts
// Description: Calculate bid and performance securities based on tender type
// Phase 1, Task 8

import logger from '../config/logger';
import * as tenderTypeService from './tenderTypeSelector.service';

export interface SecurityCalculationResult {
  tenderTypeCode: string;
  tenderValue: number;
  bidSecurity: {
    applicable: boolean;
    percentage: number | null;
    amount: number | null;
    currency: string;
    remark?: string;
  };
  performanceSecurity: {
    applicable: boolean;
    percentage: number | null;
    amount: number | null;
    currency: string;
    remark?: string;
  };
  otherSecurities?: Array<{
    name: string;
    percentage: number;
    amount: number;
  }>;
}

/**
 * Calculate bid and performance securities for a tender type and value
 */
export async function calculateSecurities(
  tenderTypeCode: string,
  tenderValue: number,
  currency: string = 'BDT'
): Promise<SecurityCalculationResult> {
  try {
    // Fetch tender type definition
    const tenderType = await tenderTypeService.getTenderTypeByCode(tenderTypeCode);

    const result: SecurityCalculationResult = {
      tenderTypeCode,
      tenderValue,
      bidSecurity: {
        applicable: false,
        percentage: null,
        amount: null,
        currency
      },
      performanceSecurity: {
        applicable: false,
        percentage: null,
        amount: null,
        currency
      }
    };

    // Bid security calculation (typically 2-5% depending on type and value)
    if (tenderType.tender_security_percent !== null) {
      result.bidSecurity.applicable = true;
      result.bidSecurity.percentage = tenderType.tender_security_percent;
      result.bidSecurity.amount = roundToNearest(
        (tenderValue * tenderType.tender_security_percent) / 100,
        100
      );

      // Add remark for low-value tenders
      if (tenderValue < 500000) {
        result.bidSecurity.remark = `For value below BDT 5 Lac, actual bid security may be lower as per PPRA guidelines`;
      }
    }

    // Performance security calculation (typically 5-10% or 10% as standard)
    if (tenderType.performance_security_percent !== null) {
      result.performanceSecurity.applicable = true;
      result.performanceSecurity.percentage = tenderType.performance_security_percent;
      result.performanceSecurity.amount = roundToNearest(
        (tenderValue * tenderType.performance_security_percent) / 100,
        100
      );

      // Add remark for turnkey contracts
      if (tenderTypeCode === 'PG5A') {
        result.performanceSecurity.remark =
          'For turnkey contracts, performance security may be held for extended period post-completion';
      }
    }

    // Additional securities based on type
    const additionalSecurities = await getAdditionalSecurities(tenderTypeCode, tenderValue);
    if (additionalSecurities.length > 0) {
      result.otherSecurities = additionalSecurities;
    }

    logger.debug(
      `Securities calculated for ${tenderTypeCode}: BidSecurity=${result.bidSecurity.amount}, PerfSecurity=${result.performanceSecurity.amount}`
    );

    return result;
  } catch (error) {
    logger.error(`Error calculating securities: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Get additional securities beyond standard bid and performance securities
 */
async function getAdditionalSecurities(
  tenderTypeCode: string,
  tenderValue: number
): Promise<Array<{ name: string; percentage: number; amount: number }>> {
  const securities: Array<{ name: string; percentage: number; amount: number }> = [];

  // International tenders may require additional guarantee
  if (tenderTypeCode === 'PG4') {
    securities.push({
      name: 'Advance Payment Security',
      percentage: 20,
      amount: roundToNearest((tenderValue * 20) / 100, 100)
    });
  }

  // Turnkey contracts require additional security
  if (tenderTypeCode === 'PG5A') {
    securities.push({
      name: 'Turnkey Completion Security',
      percentage: 5,
      amount: roundToNearest((tenderValue * 5) / 100, 100)
    });
  }

  // Works tenders above certain value may require bank guarantee
  if (tenderTypeCode === 'PW3' && tenderValue > 50000000) {
    securities.push({
      name: 'Bank Guarantee (Works)',
      percentage: 3,
      amount: roundToNearest((tenderValue * 3) / 100, 100)
    });
  }

  return securities;
}

/**
 * Calculate total security amount by summing all securities
 */
export function calculateTotalSecurity(result: SecurityCalculationResult): number {
  let total = 0;

  if (result.bidSecurity.amount) {
    total += result.bidSecurity.amount;
  }

  if (result.performanceSecurity.amount) {
    total += result.performanceSecurity.amount;
  }

  if (result.otherSecurities && result.otherSecurities.length > 0) {
    total += result.otherSecurities.reduce((sum, sec) => sum + sec.amount, 0);
  }

  return total;
}

/**
 * Format security details for display
 */
export function formatSecurityDisplay(result: SecurityCalculationResult): string {
  const lines: string[] = [];

  lines.push(`Tender Type: ${result.tenderTypeCode}`);
  lines.push(`Tender Value: ${formatBDT(result.tenderValue)}`);
  lines.push('---');

  if (result.bidSecurity.applicable && result.bidSecurity.amount) {
    lines.push(
      `Bid Security: ${result.bidSecurity.percentage}% = ${formatBDT(result.bidSecurity.amount)}`
    );
    if (result.bidSecurity.remark) {
      lines.push(`  Note: ${result.bidSecurity.remark}`);
    }
  }

  if (result.performanceSecurity.applicable && result.performanceSecurity.amount) {
    lines.push(
      `Performance Security: ${result.performanceSecurity.percentage}% = ${formatBDT(
        result.performanceSecurity.amount
      )}`
    );
    if (result.performanceSecurity.remark) {
      lines.push(`  Note: ${result.performanceSecurity.remark}`);
    }
  }

  if (result.otherSecurities && result.otherSecurities.length > 0) {
    lines.push('Additional Securities:');
    for (const sec of result.otherSecurities) {
      lines.push(`  ${sec.name}: ${sec.percentage}% = ${formatBDT(sec.amount)}`);
    }
  }

  lines.push('---');
  const total = calculateTotalSecurity(result);
  lines.push(`Total Security: ${formatBDT(total)}`);

  return lines.join('\n');
}

/**
 * Round amount to nearest hundred
 */
function roundToNearest(value: number, nearest: number = 100): number {
  return Math.ceil(value / nearest) * nearest;
}

/**
 * Format BDT value as human-readable
 */
function formatBDT(value: number): string {
  if (value >= 10000000) return `BDT ${(value / 10000000).toFixed(2)} Crore`;
  if (value >= 100000) return `BDT ${(value / 100000).toFixed(2)} Lac`;
  return `BDT ${value.toLocaleString('en-IN')}`;
}
