import { Router } from 'express';
import { createSimpleRfq, getSimpleRfqResponseForm } from '../controllers/simpleRfqController';

const router = Router();

// POST /tenders/simple-rfq
router.post('/simple-rfq', createSimpleRfq);

// GET /tenders/simple-rfq/:id/response-form
router.get('/simple-rfq/:id/response-form', getSimpleRfqResponseForm);

export default router;
