import { z } from 'zod';

export const createAwardSchema = z.object({
  bidId: z.string().uuid(),
  tenderItemId: z.string().uuid(),
  awardedQuantity: z.number().positive(),
  awardedPrice: z.number().positive(),
});

export const bulkAwardSchema = z.object({
  awards: z.array(createAwardSchema),
});

export const awardIdSchema = z.object({
  awardId: z.string().uuid(),
});

export type CreateAwardInput = z.infer<typeof createAwardSchema>;
export type BulkAwardInput = z.infer<typeof bulkAwardSchema>;
export type AwardIdInput = z.infer<typeof awardIdSchema>;
