import { z } from 'zod';

export const exportFormatEnum = z.enum(['pdf', 'xlsx']);

export const exportTypeEnum = z.enum([
  'tender_summary',
  'bid_comparison',
  'bid_integrity',
  'award_letter',
  'full_data_dump',
]);

export const exportStatusEnum = z.enum(['pending', 'processing', 'completed', 'failed']);

export const requestExportSchema = z.object({
  exportType: exportTypeEnum,
  format: exportFormatEnum,
  tenderId: z.string().uuid(),
  vendorId: z.string().uuid().optional(),
});

export const exportJobIdSchema = z.object({
  jobId: z.string().uuid(),
});

export const exportFilterSchema = z.object({
  status: exportStatusEnum.optional(),
  exportType: exportTypeEnum.optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type ExportFormat = z.infer<typeof exportFormatEnum>;
export type ExportType = z.infer<typeof exportTypeEnum>;
export type ExportStatus = z.infer<typeof exportStatusEnum>;
export type RequestExportInput = z.infer<typeof requestExportSchema>;
export type ExportJobIdInput = z.infer<typeof exportJobIdSchema>;
export type ExportFilterInput = z.infer<typeof exportFilterSchema>;
