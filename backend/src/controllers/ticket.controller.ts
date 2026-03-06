import { Request, Response, NextFunction } from 'express';
import { ticketService } from '../services/ticket.service';
import { ticketFilterSchema } from '../schemas/ticket.schema';

export const ticketController = {
  // POST /tickets — any authenticated user submits a ticket
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await ticketService.create(req.body, req.user!.id);
      res.status(201).json({ data: ticket });
    } catch (err) {
      next(err);
    }
  },

  // GET /tickets — admin: all tickets with optional filters
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = ticketFilterSchema.parse(req.query);
      const result = await ticketService.findAll(filters);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  },

  // GET /tickets/mine — current user's tickets
  async findMine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = ticketFilterSchema.parse(req.query);
      const result = await ticketService.findByUser(req.user!.id, filters);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  },

  // GET /tickets/:id — owner or admin can view
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await ticketService.findById(req.params.ticketId);
      if (!ticket) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
        return;
      }
      // Non-admins can only see their own ticket
      const isAdmin = req.user!.roles?.includes('admin');
      if (!isAdmin && ticket.submitted_by !== req.user!.id) {
        res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
        return;
      }
      res.status(200).json({ data: ticket });
    } catch (err) {
      next(err);
    }
  },

  // PATCH /tickets/:id — admin or ticket creator can update status / notes / priority
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // First fetch the ticket to check ownership before updating
      const existingTicket = await ticketService.findById(req.params.ticketId);
      if (!existingTicket) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
        return;
      }

      // Check authorization: admin or ticket creator
      const isAdmin = req.user!.roles?.includes('admin');
      if (!isAdmin && existingTicket.submitted_by !== req.user!.id) {
        res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
        return;
      }

      // Authorized, proceed with update
      const ticket = await ticketService.update(req.params.ticketId, req.body);
      res.status(200).json({ data: ticket });
    } catch (err) {
      next(err);
    }
  },
};
