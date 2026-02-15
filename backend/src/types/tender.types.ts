// Tender mode and related types for multi-tender system

export type ApiVersion = 'v1' | 'v2';

export enum TenderMode {
  SimpleRFQ = 'simple_rfq',
  DetailedRFT = 'detailed_rft',
  LiveAuction = 'live_auction',
}

export enum RfqType {
  Goods = 'goods',
  Services = 'services',
  Works = 'works',
}

export enum PaymentTerm {
  Advance = 'advance',
  OnDelivery = 'on_delivery',
  AfterAcceptance = 'after_acceptance',
}

export enum BidSecurityType {
  None = 'none',
  BankGuarantee = 'bank_guarantee',
  PayOrder = 'pay_order',
  DemandDraft = 'demand_draft',
}

export enum EvaluationMethod {
  LowestPrice = 'lowest_price',
  QCBS = 'qcbs',
  Technical = 'technical',
}

export interface SimpleRfqData {
  buyerInfo: {
    name: string;
    organization: string;
    contact: string;
  };
  rfqDetails: {
    title: string;
    description: string;
    rfqType: RfqType;
    items: Array<{
      name: string;
      quantity: number;
      unit: string;
      specs?: string;
    }>;
    deliveryLocation: string;
    deliveryDate: string;
    paymentTerm: PaymentTerm;
  };
}

export interface DetailedRftData {
  procuringEntity: string;
  timeline: {
    publishDate: string;
    closingDate: string;
    openingDate: string;
  };
  lots: Array<{
    lotNumber: string;
    description: string;
    items: Array<{
      name: string;
      quantity: number;
      unit: string;
      specs?: string;
    }>;
  }>;
  commercialTerms: string;
  financialTerms: string;
  vendorEligibility: string;
  bidSecurity: {
    type: BidSecurityType;
    amount: number;
    currency: string;
  };
  evaluationCriteria: EvaluationMethod;
  legalDeclarations: string;
}

export interface LiveTenderingConfig {
  scheduledStart: string;
  durationMinutes: number;
  biddingType: 'sealed' | 'open_reverse' | 'open_auction';
  limitedVendors?: string[];
}

export interface TenderBase {
  apiVersion: ApiVersion;
  tenderMode: TenderMode;
  // ... rest of common fields
}
