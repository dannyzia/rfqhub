import { z } from 'zod';

export const ticketTypeEnum = z.enum(['feature_request', 'bug_report']);
export const ticketPriorityEnum = z.enum(['low', 'medium', 'high', 'critical']);
export const ticketStatusEnum = z.enum(['open', 'in_progress', 'resolved', 'closed', 'wont_fix']);

// ─── User: submit a ticket ────────────────────────────────────────────────────
export const createTicketSchema = z.object({
  type: ticketTypeEnum,
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Please provide more detail (min 20 characters)').max(5000),
  priority: ticketPriorityEnum.default('medium'),
});

// ─── Admin: update ticket status / notes ─────────────────────────────────────
export const updateTicketSchema = z.object({
  status: ticketStatusEnum.optional(),
  adminNotes: z.string().max(5000).optional(),
  priority: ticketPriorityEnum.optional(),
});

// ─── Query filters ────────────────────────────────────────────────────────────
export const ticketFilterSchema = z.object({
  type:   ticketTypeEnum.optional(),
  status: ticketStatusEnum.optional(),
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateTicketInput   = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput   = z.infer<typeof updateTicketSchema>;
export type TicketFilterInput   = z.infer<typeof ticketFilterSchema>;
export type TicketType          = z.infer<typeof ticketTypeEnum>;
export type TicketPriority      = z.infer<typeof ticketPriorityEnum>;
export type TicketStatus        = z.infer<typeof ticketStatusEnum>;
