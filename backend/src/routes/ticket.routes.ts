import { Router } from 'express';
import { ticketController } from '../controllers/ticket.controller';
import { authenticate, authorize, validate } from '../middleware';
import { createTicketSchema, updateTicketSchema } from '../schemas/ticket.schema';

const router = Router();

// All ticket routes require a valid session
router.use(authenticate);

// Any authenticated user can submit a ticket
router.post('/', validate(createTicketSchema), ticketController.create);

// Current user's own tickets
router.get('/mine', ticketController.findMine);

// Detail view — access-controlled inside controller
router.get('/:ticketId', ticketController.findById);

// Admin: list all tickets
router.get('/', authorize('admin'), ticketController.findAll);

// Admin: update ticket status / notes / priority
router.patch('/:ticketId', validate(updateTicketSchema), ticketController.update);

export { router as ticketRoutes };
