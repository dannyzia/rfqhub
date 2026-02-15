import { z } from "zod";

export const createBidSchema = z.object({
  tenderId: z.string().uuid(),
});

export const bidItemSchema = z.object({
  tenderItemId: z.string().uuid(),
  envelopeType: z.enum(["technical", "commercial"]),
  unitPrice: z.number().positive().optional(),
  compliance: z.enum(["compliant", "non_compliant", "partial"]).optional(),
  nonComplianceRemarks: z.string().max(1000).optional(),
  brandMake: z.string().max(200).optional(),
});

export const bidItemFeatureValueSchema = z.object({
  featureId: z.string().uuid(),
  optionId: z.string().uuid().optional(),
  textValue: z.string().max(1000).optional(),
  numericValue: z.number().optional(),
});

export const updateBidSchema = z.object({
  items: z.array(bidItemSchema),
  featureValues: z.array(bidItemFeatureValueSchema).optional(),
});

export const submitBidSchema = z.object({
  confirmSubmission: z.literal(true),
});

export const bidIdSchema = z.object({
  bidId: z.string().uuid(),
});

export type CreateBidInput = z.infer<typeof createBidSchema>;
export type BidItemInput = z.infer<typeof bidItemSchema>;
export type BidItemFeatureValueInput = z.infer<
  typeof bidItemFeatureValueSchema
>;
export type UpdateBidInput = z.infer<typeof updateBidSchema>;
export type SubmitBidInput = z.infer<typeof submitBidSchema>;
export type BidIdInput = z.infer<typeof bidIdSchema>;
