import { z } from 'zod';

export const simpleRfqDataSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  procurementType: z.enum(['goods', 'services', 'works']),
  tenderType: z.string().min(1, 'Tender type is required'),
  estimatedCost: z.number().positive('Estimated cost must be positive'),
  currency: z.string().default('BDT'),
  submissionDeadline: z.string().datetime('Invalid deadline date'),
  vendorIds: z.array(z.string()).optional(),
});

export type SimpleRfqData = z.infer<typeof simpleRfqDataSchema>;
