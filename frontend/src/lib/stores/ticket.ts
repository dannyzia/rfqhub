import { api } from '$lib/utils/api';

export type TicketType     = 'feature_request' | 'bug_report';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketStatus   = 'open' | 'in_progress' | 'resolved' | 'closed' | 'wont_fix';

export interface Ticket {
  id: string;
  ticket_number: number;
  type: TicketType;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  submitted_by: string;
  submitter_name?: string;
  submitter_email?: string;
  admin_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedTickets {
  tickets: Ticket[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateTicketPayload {
  type: TicketType;
  title: string;
  description: string;
  priority?: TicketPriority;
}

export interface UpdateTicketPayload {
  status?: TicketStatus;
  adminNotes?: string;
  priority?: TicketPriority;
}

export interface TicketFilters {
  type?: TicketType;
  status?: TicketStatus;
  page?: number;
  limit?: number;
}

function buildQuery(filters: TicketFilters): string {
  const params = new URLSearchParams();
  if (filters.type)   params.set('type',   filters.type);
  if (filters.status) params.set('status', filters.status);
  if (filters.page)   params.set('page',   String(filters.page));
  if (filters.limit)  params.set('limit',  String(filters.limit));
  const q = params.toString();
  return q ? `?${q}` : '';
}

export const ticketApi = {
  submit(payload: CreateTicketPayload): Promise<Ticket> {
    return api.post<Ticket>('/tickets', payload);
  },

  getMyTickets(filters: TicketFilters = {}): Promise<PaginatedTickets> {
    return api.get<PaginatedTickets>(`/tickets/mine${buildQuery(filters)}`);
  },

  getTicket(id: string): Promise<Ticket> {
    return api.get<Ticket>(`/tickets/${id}`);
  },

  // Admin only
  getAllTickets(filters: TicketFilters = {}): Promise<PaginatedTickets> {
    return api.get<PaginatedTickets>(`/tickets${buildQuery(filters)}`);
  },

  updateTicket(id: string, payload: UpdateTicketPayload): Promise<Ticket> {
    return api.put<Ticket>(`/tickets/${id}`, payload);
  },
};
