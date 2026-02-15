import { Router } from 'express';
import { evaluationController } from '../controllers/evaluation.controller';
import { awardController } from '../controllers/award.controller';
import { authenticate, authorize, validate } from '../middleware';
import {
  createEvaluationSchema,
  unlockCommercialSchema,
} from '../schemas/evaluation.schema';
import { createAwardSchema, bulkAwardSchema } from '../schemas/award.schema';

const router = Router();

router.use(authenticate);

router.post(
  '/tenders/:tenderId/open-technical',
  authorize('buyer', 'admin'),
  evaluationController.openTechnicalEnvelopes,
);

router.post(
  '/tenders/:tenderId/unlock-commercial',
  authorize('buyer', 'admin'),
  validate(unlockCommercialSchema),
  evaluationController.unlockCommercialEnvelopes,
);

router.post(
  '/evaluations',
  authorize('buyer', 'admin', 'evaluator'),
  validate(createEvaluationSchema),
  evaluationController.create,
);

router.post(
  '/tenders/:tenderId/calculate-commercial',
  authorize('buyer', 'admin'),
  evaluationController.calculateCommercialScores,
);

router.get(
  '/evaluations/bid/:bidId',
  authorize('buyer', 'admin', 'evaluator'),
  evaluationController.findByBidId,
);

router.get(
  '/tenders/:tenderId/evaluations',
  authorize('buyer', 'admin', 'evaluator'),
  evaluationController.findByTenderId,
);

router.get(
  '/tenders/:tenderId/comparison',
  authorize('buyer', 'admin', 'evaluator'),
  evaluationController.getComparisonMatrix,
);

router.get(
  '/tenders/:tenderId/ranking',
  authorize('buyer', 'admin', 'evaluator'),
  evaluationController.getRanking,
);

router.post(
  '/tenders/:tenderId/awards',
  authorize('buyer', 'admin'),
  validate(createAwardSchema),
  awardController.create,
);
router.post(
  '/tenders/:tenderId/awards/bulk',
  authorize('buyer', 'admin'),
  validate(bulkAwardSchema),
  awardController.createBulk,
);
router.get(
  '/tenders/:tenderId/awards',
  authorize('buyer', 'admin', 'vendor'),
  awardController.findByTenderId,
);
router.get(
  '/awards/:awardId',
  authorize('buyer', 'admin', 'vendor'),
  awardController.findById,
);
router.post(
  '/tenders/:tenderId/finalize',
  authorize('buyer', 'admin'),
  awardController.finalize,
);
router.get(
  '/tenders/:tenderId/awards/summary',
  authorize('buyer', 'admin'),
  awardController.getSummary,
);

export { router as evaluationRoutes };
