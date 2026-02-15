import { z } from 'zod';

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

export type AppliesTo = z.infer<typeof appliesTo>;
export type CreateTaxRuleInput = z.infer<typeof createTaxRuleSchema>;
export type UpdateTaxRuleInput = z.infer<typeof updateTaxRuleSchema>;
export type TaxRuleIdInput = z.infer<typeof taxRuleIdSchema>;
export type TaxFilterInput = z.infer<typeof taxFilterSchema>;
