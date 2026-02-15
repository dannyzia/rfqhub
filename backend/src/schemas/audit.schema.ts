import { z } from 'zod';

export const auditActionEnum = z.enum([
  'TENDER_CREATED',
  'TENDER_UPDATED',
  'TENDER_PUBLISHED',
  'TENDER_CANCELLED',
  'TENDER_CLOSED',
  'BID_CREATED',
  'BID_SUBMITTED',
  'BID_WITHDRAWN',
  'ENVELOPE_OPENED',
  'EVALUATION_SUBMITTED',
  'AWARD_ISSUED',
  'VENDOR_APPROVED',
  'VENDOR_REJECTED',
  'VENDOR_SUSPENDED',
  'ADDENDUM_PUBLISHED',
  'CLARIFICATION_ANSWERED',
  'USER_LOGIN',
  'USER_LOGOUT',
  'USER_REGISTERED',
  'EXPORT_REQUESTED',
  'EXPORT_COMPLETED',
]);

export const auditEntityTypeEnum = z.enum([
  'tender',
  'bid',
  'vendor',
  'user',
  'addendum',
  'clarification',
  'evaluation',
  'award',
  'export',
]);

export const auditFilterSchema = z.object({
  actorId: z.string().uuid().optional(),
  action: auditActionEnum.optional(),
  entityType: auditEntityTypeEnum.optional(),
  entityId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(500).default(100),
  offset: z.number().int().min(0).default(0),
});

export const createAuditLogSchema = z.object({
  actorId: z.string().uuid().nullable(),
  action: auditActionEnum,
  entityType: auditEntityTypeEnum,
  entityId: z.string().uuid(),
  metadata: z.record(z.unknown()).optional(),
});

export type AuditAction = z.infer<typeof auditActionEnum>;
export type AuditEntityType = z.infer<typeof auditEntityTypeEnum>;
export type AuditFilterInput = z.infer<typeof auditFilterSchema>;
export type CreateAuditLogInput = z.infer<typeof createAuditLogSchema>;
