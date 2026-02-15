import { z } from "zod";
import { TenderMode, RfqType, PaymentTerm, BidSecurityType, EvaluationMethod } from "../types/tender.types";

export const simpleRfqDataSchema = z.object({
  buyerInfo: z.object({
    name: z.string().min(2),
    organization: z.string().min(2),
    contact: z.string().min(5),
  }),
  rfqDetails: z.object({
    title: z.string().min(5),
    description: z.string().min(5),
    rfqType: z.nativeEnum(RfqType),
    tenderType: z.string().min(2), // NEW: Required tender type
    estimatedValue: z.number().nonnegative().optional(), // NEW: For validation
    currency: z.string().length(3).default("BDT"), // NEW: Currency for value
    items: z.array(z.object({
      name: z.string().min(2),
      quantity: z.number().positive(),
      unit: z.string().min(1),
      specs: z.string().optional(),
    })),
    deliveryLocation: z.string().min(2),
    deliveryDate: z.string(),
    paymentTerm: z.nativeEnum(PaymentTerm),
  })
});

export const detailedRftDataSchema = z.object({
  procuringEntity: z.string().min(2),
  timeline: z.object({
    publishDate: z.string(),
    closingDate: z.string(),
    openingDate: z.string(),
  }),
  lots: z.array(z.object({
    lotNumber: z.string().min(1),
    description: z.string().min(2),
    items: z.array(z.object({
      name: z.string().min(2),
      quantity: z.number().positive(),
      unit: z.string().min(1),
      specs: z.string().optional(),
    })),
  })),
  commercialTerms: z.string().min(2),
  financialTerms: z.string().min(2),
  vendorEligibility: z.string().min(2),
  bidSecurity: z.object({
    type: z.nativeEnum(BidSecurityType),
    amount: z.number().nonnegative(),
    currency: z.string().length(3),
  }),
  evaluationCriteria: z.nativeEnum(EvaluationMethod),
  legalDeclarations: z.string().min(2),
});

export const liveTenderingConfigSchema = z.object({
  scheduledStart: z.string(),
  durationMinutes: z.number().positive(),
  biddingType: z.enum(["sealed", "open_reverse", "open_auction"]),
  limitedVendors: z.array(z.string()).optional(),
  settings: z.object({
    minBidIncrement: z.number().nonnegative().optional(), // For open auctions
    bidVisibility: z.enum(["hidden", "visible", "after_close"]).default("hidden"),
    allowBidWithdrawal: z.boolean().default(false),
    requirePrequalification: z.boolean().default(false),
    autoExtendOnLastMinute: z.boolean().default(false),
    extensionMinutes: z.number().nonnegative().default(5),
  }).optional(),
});

export const liveTenderingDataSchema = z.object({
  tenderId: z.string(),
  scheduledStart: z.string(),
  scheduledEnd: z.string(),
  biddingType: z.enum(["sealed", "open_reverse", "open_auction"]),
  settings: z.object({
    minBidIncrement: z.number().nonnegative().optional(),
    bidVisibility: z.enum(["hidden", "visible", "after_close"]).default("hidden"),
    allowBidWithdrawal: z.boolean().default(false),
    requirePrequalification: z.boolean().default(false),
    autoExtendOnLastMinute: z.boolean().default(false),
    extensionMinutes: z.number().nonnegative().default(5),
  }).optional(),
  limitedVendors: z.array(z.string()).optional(),
});

export const tenderBaseSchema = z.object({
  apiVersion: z.enum(["v1", "v2"]),
  tenderMode: z.nativeEnum(TenderMode),
  // ... add other common fields as needed
});
