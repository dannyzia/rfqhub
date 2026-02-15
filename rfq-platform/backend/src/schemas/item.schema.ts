import { z } from 'zod';

export const createItemSchema = z.object({
  parentItemId: z.string().uuid().nullable().optional(),
  itemType: z.enum(['group', 'item']),
  slNo: z.number().int().min(1),
  itemCode: z.string().max(50).optional(),
  itemName: z.string().min(1).max(200),
  specification: z.string().max(5000).optional(),
  quantity: z.number().min(0),
  uom: z.string().max(20).optional(),
  estimatedCost: z.number().positive().optional(),
});

export const updateItemSchema = createItemSchema.partial().omit({ parentItemId: true });

export const itemIdSchema = z.object({
  id: z.string().uuid(),
  tenderId: z.string().uuid(),
});

export const reorderItemsSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    slNo: z.number().int().min(1),
  })),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type ItemIdInput = z.infer<typeof itemIdSchema>;
export type ReorderItemsInput = z.infer<typeof reorderItemsSchema>;
