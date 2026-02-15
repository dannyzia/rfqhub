import { z } from "zod";

// Base tender schema without custom validation
const baseTenderSchema = z.object({
  title: z.string().min(5).max(255),
  
  // Changed from enum to string (references tender_type_definitions.code)
  tenderType: z.string()
    .min(2, 'Tender type code is required')
    .max(10, 'Tender type code too long'),
  
  visibility: z.enum(["open", "limited"]),
  
  procurementType: z.enum(["goods", "works", "services"]),
  
  fundAllocation: z.number()
    .positive('Fund allocation must be positive')
    .optional(),
  
  estimatedCost: z.number()
    .positive('Estimated cost must be positive')
    .optional(),
  
  currency: z.string().length(3).default("BDT"),
  
  priceBasis: z.enum(["unit_rate", "lump_sum"]).default("unit_rate"),
  
  submissionDeadline: z.string(),
  
  bidOpeningTime: z.string().optional(),
  
  validityDays: z.number()
    .int()
    .positive()
    .optional(), // If not provided, use tender type default
  
  // Bid security is now optional - will be auto-calculated if not provided
  bidSecurityAmount: z.number()
    .nonnegative()
    .optional(),
  
  // New field: specify two-envelope requirement
  twoEnvelopeSystem: z.boolean().optional(),
  
  // Existing fields
  preBidMeetingDate: z.string().optional(),
  preBidMeetingLink: z.string().url().optional(),
  description: z.string().optional(),
  scopeOfWork: z.string().optional(),
  technicalSpecs: z.any().optional() // JSONB field
});

export const createTenderSchema = baseTenderSchema.superRefine(async (data, ctx) => {
  // Custom validation: tender value must match tender type
  if (data.estimatedCost && data.tenderType) {
    try {
      const { validateTenderValue } = await import('../services/valueValidation.service');
      const validation = await validateTenderValue(data.estimatedCost, data.tenderType);
      
      if (!validation.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: validation.message || 'Value does not match tender type',
          path: ['estimatedCost']
        });
      }
    } catch (error) {
      // If validation service fails, log but don't block tender creation
      console.error('Tender value validation failed:', error);
    }
  }
});

// Update schema - use base schema partial, no custom validation
export const updateTenderSchema = baseTenderSchema.partial();

export const tenderIdSchema = z.object({
  id: z.string().uuid(),
});

export const publishTenderSchema = z.object({
  invitedVendorIds: z.array(z.string().uuid()).optional(),
});

export type CreateTenderInput = z.infer<typeof createTenderSchema>;
export type UpdateTenderInput = z.infer<typeof updateTenderSchema>;
export type TenderIdInput = z.infer<typeof tenderIdSchema>;
export type PublishTenderInput = z.infer<typeof publishTenderSchema>;
