import { Router } from 'express';
import { createSimpleRfq, getSimpleRfqResponseForm, getSimpleRfqTenderType } from '../controllers/simpleRfqController';
import { authenticate, authorize } from '../middleware';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// POST /tenders/simple-rfq - Requires buyer or vendor role
router.post('/simple-rfq', authorize('buyer', 'vendor', 'admin'), createSimpleRfq);

// GET /tenders/simple-rfq/:id/response-form - Read access for authenticated users
router.get('/simple-rfq/:id/response-form', getSimpleRfqResponseForm);

// GET /tenders/simple-rfq/:id/tender-type - Read access for authenticated users
router.get('/simple-rfq/:id/tender-type', getSimpleRfqTenderType);

export default router;
