// Tender type definitions
export interface TenderTypeDefinition {
  code: string;
  name: string;
  governmentOnly: boolean;
  minValue?: number;
  maxValue?: number;
  procurementType: string;
  twoEnvelopeRequired?: boolean;
  requiresCommittee?: boolean;
}

export interface TenderTypeRange {
  minValue: number;
  maxValue: number | null;
  label: string;
  suggestedTypes: string[];
}

export interface ValueRangesData {
  procurementType: string;
  ranges: TenderTypeRange[];
  specialCases?: Record<string, any>;
}
