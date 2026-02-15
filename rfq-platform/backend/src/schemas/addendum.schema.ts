import { z } from 'zod';

export const createAddendumSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(10000),
  extendsDeadlineDays: z.number().int().min(0).max(90).optional(),
});

export const addendumIdSchema = z.object({
  addendumId: z.string().uuid(),
});

export const acknowledgeAddendumSchema = z.object({
  acknowledged: z.literal(true),
});

export type CreateAddendumInput = z.infer<typeof createAddendumSchema>;
export type AddendumIdInput = z.infer<typeof addendumIdSchema>;
export type AcknowledgeAddendumInput = z.infer<typeof acknowledgeAddendumSchema>;
