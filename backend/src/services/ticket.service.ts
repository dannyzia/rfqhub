import { db } from '../config/database';
import { supportTickets, ticketMessages } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const ticketService = {
  async listAll() {
    return db.select().from(supportTickets).orderBy(desc(supportTickets.created_at));
  },

  async listByUser(userId: string) {
    return db.select().from(supportTickets)
      .where(eq(supportTickets.submitted_by, userId))
      .orderBy(desc(supportTickets.created_at));
  },

  async getById(id: string) {
    const [ticket] = await db.select().from(supportTickets)
      .where(eq(supportTickets.id, id)).limit(1);
    if (!ticket) return null;

    const messages = await db.select().from(ticketMessages)
      .where(eq(ticketMessages.ticket_id, id))
      .orderBy(ticketMessages.created_at);

    return { ticket, messages };
  },

  async create(data: {
    subject: string;
    description: string;
    type?: string;
    priority?: string;
    submitted_by: string;
    org_id: string | null;
  }) {
    const [ticket] = await db.insert(supportTickets).values({
      description: data.description,
      type: data.type ?? 'general',
      priority: data.priority ?? 'medium',
      submitted_by: data.submitted_by,
      org_id: data.org_id,
    } as never).returning();
    return ticket;
  },

  async addMessage(ticketId: string, senderId: string, message: string, isInternal = false) {
    const [msg] = await db.insert(ticketMessages).values({
      ticket_id: ticketId,
      sender_id: senderId,
      message,
      is_internal: isInternal,
    }).returning();
    return msg;
  },

  async update(id: string, data: Record<string, any>) {
    const [updated] = await db.update(supportTickets).set({
      ...data,
      updated_at: new Date(),
      ...(data.status === 'resolved' ? { resolved_at: new Date() } : {}),
      ...(data.status === 'closed' ? { closed_at: new Date() } : {}),
    }).where(eq(supportTickets.id, id)).returning();
    return updated;
  },
};
