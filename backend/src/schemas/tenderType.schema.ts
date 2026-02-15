// backend/src/schemas/tenderType.schema.ts
// Description: Zod validation schemas for tender type APIs
// Phase 2, Task 10

import { z } from 'zod';

/**
 * Schema for tender type suggestion request
 */
export const tenderTypeSuggestionSchema = z.object({
  procurementType: z.enum(['goods', 'works', 'services'], {
    required_error: 'Procurement type is required',
    invalid_type_error: 'Procurement type must be goods, works, or services'
  }),

  estimatedValue: z
    .number({
      required_error: 'Estimated value is required',
      invalid_type_error: 'Estimated value must be a number'
    })
    .positive('Estimated value must be positive'),

  currency: z.string().length(3).default('BDT').optional(),

  isInternational: z.boolean().default(false).optional(),

  isEmergency: z.boolean().default(false).optional(),

  isSingleSource: z.boolean().default(false).optional(),

  isTurnkey: z.boolean().default(false).optional(),

  isOutsourcingPersonnel: z.boolean().default(false).optional()
});

export type TenderTypeSuggestionInput = z.infer<typeof tenderTypeSuggestionSchema>;

/**
 * Schema for value validation request
 */
export const valueValidationSchema = z.object({
  value: z.number().positive('Value must be positive'),
  tenderTypeCode: z.string().min(2).max(10)
});

export type ValueValidationInput = z.infer<typeof valueValidationSchema>;

/**
 * Schema for security calculation request
 */
export const securityCalculationSchema = z.object({
  tenderValue: z.number().positive('Tender value must be positive'),
  tenderTypeCode: z.string().min(2).max(10)
});

export type SecurityCalculationInput = z.infer<typeof securityCalculationSchema>;
