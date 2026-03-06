import { v4 as uuidv4 } from 'uuid';
import { pool, logger } from '../config';
import type { CreateTicketInput, UpdateTicketInput, TicketFilterInput } from '../schemas/ticket.schema';

export interface TicketRow {
  id: string;
  ticket_number: number;
  type: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  submitted_by: string;
  submitter_name?: string;
  submitter_email?: string;
  admin_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedTickets {
  tickets: TicketRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Helper Functions ──────────────────────────────────────────────────────────

/**
 * Builds WHERE conditions and parameters for ticket filtering.
 * Consolidates the duplicated filter-building logic from findAll and findByUser.
 */
function buildFilterConditions(
  filters: TicketFilterInput,
  userId?: string,
): { conditions: string[]; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (userId) {
    conditions.push(`t.submitted_by = $${i++}`);
    params.push(userId);
  }

  if (filters.type) {
    conditions.push(`t.type = $${i++}`);
    params.push(filters.type);
  }

  if (filters.status) {
    conditions.push(`t.status = $${i++}`);
    params.push(filters.status);
  }

  return { conditions, params };
}

/**
 * Executes a paginated query with count.
 * Consolidates the duplicated pagination logic from findAll and findByUser.
 */
async function executePaginatedQuery(
  filters: TicketFilterInput,
  userId?: string,
  includeUserDetails = false,
): Promise<PaginatedTickets> {
  const { page, limit } = filters;
  const { conditions, params } = buildFilterConditions(filters, userId);
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // Execute count query
  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM support_tickets t ${where}`,
    params,
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Build SELECT query based on whether to include user details
  let selectQuery: string;
  if (includeUserDetails) {
    selectQuery = `
      SELECT t.*,
             u.first_name || ' ' || u.last_name AS submitter_name,
             u.email AS submitter_email
      FROM support_tickets t
      JOIN users u ON u.id = t.submitted_by
    `;
  } else {
    selectQuery = `
      SELECT t.*
      FROM support_tickets t
    `;
  }

  // Execute data query with pagination
  const dataParams = [...params, limit, (page - 1) * limit];
  const { rows } = await pool.query<TicketRow>(
    `${selectQuery} ${where}
     ORDER BY t.created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    dataParams,
  );

  return { tickets: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export const ticketService = {
  // ─── Create ─────────────────────────────────────────────────────────────────
  async create(input: CreateTicketInput, userId: string): Promise<TicketRow> {
    const id = uuidv4();
    const { rows } = await pool.query<TicketRow>(
      `INSERT INTO support_tickets (id, type, title, description, priority, submitted_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, input.type, input.title, input.description, input.priority, userId],
    );
    logger.info(`Support ticket created: ${id} type=${input.type} by user=${userId}`);
    return rows[0];
  },

  // ─── Get all (admin) ─────────────────────────────────────────────────────────
  async findAll(filters: TicketFilterInput): Promise<PaginatedTickets> {
    return executePaginatedQuery(
      filters,
      undefined,
      true, // Include user details for admin view
    );
  },

  // ─── Get my tickets (user) ────────────────────────────────────────────────────
  async findByUser(userId: string, filters: TicketFilterInput): Promise<PaginatedTickets> {
    return executePaginatedQuery(
      filters,
      userId,
      false, // No user details needed for own tickets
    );
  },

  // ─── Get single ───────────────────────────────────────────────────────────────
  async findById(ticketId: string): Promise<TicketRow | null> {
    const { rows } = await pool.query<TicketRow>(
      `SELECT t.*,
              u.first_name || ' ' || u.last_name AS submitter_name,
              u.email AS submitter_email
       FROM support_tickets t
       JOIN users u ON u.id = t.submitted_by
       WHERE t.id = $1`,
      [ticketId],
    );
    return rows[0] ?? null;
  },

  // ─── Admin update ─────────────────────────────────────────────────────────────
  async update(ticketId: string, input: UpdateTicketInput): Promise<TicketRow | null> {
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    if (input.status !== undefined) {
      setClauses.push(`status = $${i++}`);
      params.push(input.status);
      if (input.status === 'resolved' || input.status === 'closed') {
        setClauses.push(`resolved_at = NOW()`);
      }
    }
    if (input.adminNotes !== undefined) {
      setClauses.push(`admin_notes = $${i++}`);
      params.push(input.adminNotes);
    }
    if (input.priority !== undefined) {
      setClauses.push(`priority = $${i++}`);
      params.push(input.priority);
    }

    if (setClauses.length === 0) return this.findById(ticketId);

    params.push(ticketId);
    const { rows } = await pool.query<TicketRow>(
      `UPDATE support_tickets SET ${setClauses.join(', ')} WHERE id = $${i} RETURNING *`,
      params,
    );
    logger.info(`Support ticket updated: ${ticketId}`);
    return rows[0] ?? null;
  },
};
