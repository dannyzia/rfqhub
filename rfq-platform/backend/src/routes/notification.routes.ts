import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { clarificationController } from '../controllers/clarification.controller';
import { addendumController } from '../controllers/addendum.controller';
import { authenticate, authorize, validate } from '../middleware';
import { createQuestionSchema, answerQuestionSchema } from '../schemas/clarification.schema';
import { createAddendumSchema, acknowledgeAddendumSchema } from '../schemas/addendum.schema';

const router = Router();

router.use(authenticate);

// Notifications
router.get('/notifications', notificationController.getMyNotifications);
router.put('/notifications/:notificationId/read', notificationController.markAsRead);
router.post('/notifications/process', authorize('admin'), notificationController.processPending);

// Clarifications
router.post('/tenders/:tenderId/questions', authorize('vendor'), validate(createQuestionSchema), clarificationController.createQuestion);
router.get('/tenders/:tenderId/questions', clarificationController.findByTenderId);
router.get('/questions/:questionId', clarificationController.findById);
router.post('/questions/:questionId/answer', authorize('buyer', 'admin'), validate(answerQuestionSchema), clarificationController.answerQuestion);
router.post('/questions/:questionId/close', authorize('buyer', 'admin'), clarificationController.closeQuestion);

// Addenda
router.post('/tenders/:tenderId/addenda', authorize('buyer', 'admin'), validate(createAddendumSchema), addendumController.create);
router.get('/tenders/:tenderId/addenda', addendumController.findByTenderId);
router.get('/tenders/:tenderId/addenda/unacknowledged', authorize('vendor'), addendumController.getMyUnacknowledged);
router.get('/addenda/:addendumId', addendumController.findById);
router.post('/addenda/:addendumId/acknowledge', authorize('vendor'), validate(acknowledgeAddendumSchema), addendumController.acknowledge);

export { router as notificationRoutes };
