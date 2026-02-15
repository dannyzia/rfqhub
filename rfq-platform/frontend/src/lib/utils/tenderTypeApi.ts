// frontend/src/lib/utils/tenderTypeApi.ts
// Description: API client for tender type operations

import { api } from './api';

export interface TenderTypeSuggestionRequest {
  procurementType: 'goods' | 'works' | 'services';
  estimatedValue: number;
  currency?: string;
  isInternational?: boolean;
  isEmergency?: boolean;
  isSingleSource?: boolean;
  isTurnkey?: boolean;
  isOutsourcingPersonnel?: boolean;
}

export interface TenderTypeSuggestion {
  code: string;
  name: string;
  confidence: number;
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
  min_submission_days: number;
  max_submission_days: number;
  default_validity_days: number;
  section_count: number;
  is_international: boolean;
}

export interface SecurityCalculationResult {
  tenderSecurity: number;
  performanceSecurity: number;
  retentionMoney: number;
  total: number;
}

/**
 * Get all tender types
 */
export async function listTenderTypes(procurementType?: string): Promise<TenderTypeDefinition[]> {
  const url = procurementType
    ? `/tender-types?procurementType=${procurementType}`
    : '/tender-types';

  const response = await api.get<{ success: boolean; data: TenderTypeDefinition[] }>(url);
  return response.data || [];
}

/**
 * Get tender type suggestions
 */
export async function suggestTenderType(
  params: TenderTypeSuggestionRequest
): Promise<TenderTypeSuggestion[]> {
  const response = await api.post<{
    success: boolean;
    data: TenderTypeSuggestion[];
    recommended: TenderTypeSuggestion;
  }>('/tender-types/suggest', params);

  return response.data || [];
}

/**
 * Get tender type by code
 */
export async function getTenderTypeByCode(code: string): Promise<TenderTypeDefinition> {
  const response = await api.get<{ success: boolean; data: TenderTypeDefinition }>(
    `/tender-types/${code}`
  );
  return response.data;
}

/**
 * Validate tender value for a type
 */
export async function validateTenderValue(value: number, tenderTypeCode: string) {
  const response = await api.post<{
    success: boolean;
    data: {
      valid: boolean;
      message?: string;
      suggestedType?: string;
    };
  }>('/tender-types/validate-value', { value, tenderTypeCode });

  return response.data;
}

/**
 * Calculate securities
 */
export async function calculateSecurities(
  tenderValue: number,
  tenderTypeCode: string
): Promise<SecurityCalculationResult> {
  const response = await api.post<{
    success: boolean;
    data: SecurityCalculationResult;
  }>('/tender-types/calculate-securities', { tenderValue, tenderTypeCode });

  return response.data;
}

/**
 * Get required documents for tender type
 */
export async function getRequiredDocuments(
  tenderTypeCode: string,
  grouped?: boolean
): Promise<any[]> {
  const url = `/tender-types/${tenderTypeCode}/documents${grouped ? '?grouped=true' : ''}`;
  const response = await api.get<{ success: boolean; data: any[] }>(url);
  return response.data || [];
}
