import { z } from 'zod';

export const createFeatureSchema = z.object({
  name: z.string().min(1).max(100),
  featureType: z.enum(['single_select', 'multi_select', 'text', 'numeric', 'boolean']),
  scoringType: z.enum(['binary', 'graded', 'numeric']).default('binary'),
  evaluationWeight: z.number().min(0).max(100).optional(),
  isGlobal: z.boolean().default(false),
});

export const createOptionSchema = z.object({
  optionValue: z.string().min(1).max(150),
  optionScore: z.number().min(0).max(100).default(0),
  sortOrder: z.number().int().min(0).default(0),
});

export const attachFeatureSchema = z.object({
  featureId: z.string().uuid(),
  isMandatory: z.boolean().default(true),
});

export const featureIdSchema = z.object({
  id: z.string().uuid(),
});

export type CreateFeatureInput = z.infer<typeof createFeatureSchema>;
export type CreateOptionInput = z.infer<typeof createOptionSchema>;
export type AttachFeatureInput = z.infer<typeof attachFeatureSchema>;
export type FeatureIdInput = z.infer<typeof featureIdSchema>;
