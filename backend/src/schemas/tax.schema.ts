import { z } from 'zod';

// ============================================================================
// TAX RULES (existing - for procurement type-based tax rules)
// ============================================================================

export const appliesTo = z.enum(['goods', 'works', 'services', 'all']);

export const createTaxRuleSchema = z.object({
  name: z.string().min(2).max(100),
  ratePercent: z.number().min(0).max(100).transform(v => parseFloat(v.toFixed(2))),
  appliesTo: appliesTo,
  isActive: z.boolean().default(true),
});

export const updateTaxRuleSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  ratePercent: z.number().min(0).max(100).transform(v => parseFloat(v.toFixed(2))).optional(),
  appliesTo: appliesTo.optional(),
  isActive: z.boolean().optional(),
});

export const taxRuleIdSchema = z.object({
  taxRuleId: z.string().uuid(),
});

export const taxFilterSchema = z.object({
  appliesTo: appliesTo.optional(),
  isActive: z.boolean().optional(),
});

// ============================================================================
// TAX RATES (new - for jurisdiction-based tax rates with Redis caching)
// ============================================================================

export const countryCodeSchema = z.string().length(2).regex(/^[A-Z]{2}$/, 'Invalid country code (must be 2-letter ISO code)');

export const stateCodeSchema = z.string().max(10).optional();

export const taxTypeSchema = z.enum(['VAT', 'GST', 'Sales Tax', 'Service Tax', 'Excise Tax', 'Customs Duty', 'Other']);

export const createTaxRateSchema = z.object({
  countryCode: countryCodeSchema,
  stateCode: stateCodeSchema,
  taxType: taxTypeSchema,
  rate: z.number().min(0).max(100).transform(v => parseFloat(v.toFixed(2))),
  effectiveDate: z.coerce.date().min(new Date('2000-01-01'), 'Effective date must be after 2000-01-01'),
  expiryDate: z.coerce.date().optional().refine(
    (date) => !date || date >= new Date(), 
    'Expiry date must be in the future or null'
  ),
  createdBy: z.string().uuid().optional(),
});

export const updateTaxRateSchema = z.object({
  countryCode: countryCodeSchema.optional(),
  stateCode: stateCodeSchema.optional(),
  taxType: taxTypeSchema.optional(),
  rate: z.number().min(0).max(100).transform(v => parseFloat(v.toFixed(2))).optional(),
  effectiveDate: z.coerce.date().min(new Date('2000-01-01')).optional(),
  expiryDate: z.coerce.date().optional().refine(
    (date) => !date || date >= new Date(), 
    'Expiry date must be in the future or null'
  ),
});

export const taxRateIdSchema = z.object({
  taxRateId: z.string().uuid(),
});

export const taxRateFilterSchema = z.object({
  countryCode: countryCodeSchema.optional(),
  stateCode: stateCodeSchema.optional(),
  taxType: taxTypeSchema.optional(),
  activeOnly: z.boolean().default(true),
  effectiveDate: z.coerce.date().optional(),
});

export const calculateTaxSchema = z.object({
  amount: z.number().min(0).transform(v => parseFloat(v.toFixed(2))),
  countryCode: countryCodeSchema,
  stateCode: stateCodeSchema.optional(),
  taxType: taxTypeSchema.optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type AppliesTo = z.infer<typeof appliesTo>;
export type CreateTaxRuleInput = z.infer<typeof createTaxRuleSchema>;
export type UpdateTaxRuleInput = z.infer<typeof updateTaxRuleSchema>;
export type TaxRuleIdInput = z.infer<typeof taxRuleIdSchema>;
export type TaxFilterInput = z.infer<typeof taxFilterSchema>;

export type CreateTaxRateInput = z.infer<typeof createTaxRateSchema>;
export type UpdateTaxRateInput = z.infer<typeof updateTaxRateSchema>;
export type TaxRateIdInput = z.infer<typeof taxRateIdSchema>;
export type TaxRateFilterInput = z.infer<typeof taxRateFilterSchema>;
export type CalculateTaxInput = z.infer<typeof calculateTaxSchema>;
