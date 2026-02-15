import { z } from 'zod';

export const lineScoreSchema = z.object({
  tenderItemId: z.string().uuid(),
  featureId: z.string().uuid(),
  score: z.number().min(0).max(100),
  remarks: z.string().max(500).optional(),
});

export const createEvaluationSchema = z.object({
  bidId: z.string().uuid(),
  technicalScore: z.number().min(0).max(100),
  lineScores: z.array(lineScoreSchema),
  remarks: z.string().max(2000).optional(),
});

export const openEnvelopeSchema = z.object({
  envelopeType: z.enum(['technical', 'commercial']),
});

export const openBidsSchema = z.object({
  bidIds: z.array(z.string().uuid()).optional(),
});

export const unlockCommercialSchema = z.object({
  bidIds: z.array(z.string().uuid()),
});

export type LineScoreInput = z.infer<typeof lineScoreSchema>;
export type CreateEvaluationInput = z.infer<typeof createEvaluationSchema>;
export type OpenEnvelopeInput = z.infer<typeof openEnvelopeSchema>;
export type OpenBidsInput = z.infer<typeof openBidsSchema>;
export type UnlockCommercialInput = z.infer<typeof unlockCommercialSchema>;
