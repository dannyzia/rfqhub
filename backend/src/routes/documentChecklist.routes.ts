// backend/src/routes/documentChecklist.routes.ts
// Description: Document checklist routes (tender-specific)
// Phase 2, Task 14

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as documentChecklistController from '../controllers/documentChecklist.controller';
import * as documentUploadController from '../controllers/documentUpload.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/tenders/:tenderId/document-checklist
 * Get document checklist with submission status
 * Available to: vendors (own submissions), buyers, admins
 */
router.get(
  '/:tenderId/document-checklist',
  documentChecklistController.getDocumentChecklist
);

/**
 * POST /api/tenders/:tenderId/documents/validate
 * Validate document completeness before bid submission
 * Available to: vendors (own), buyers, admins
 */
router.post(
  '/:tenderId/documents/validate',
  documentChecklistController.validateDocumentCompleteness
);

/**
 * GET /api/tenders/:tenderId/missing-documents
 * Get list of mandatory documents still needing upload
 */
router.get(
  '/:tenderId/missing-documents',
  documentChecklistController.getMissingDocuments
);

/**
 * POST /api/tenders/:tenderId/documents/upload
 * Upload a document for a specific requirement
 * Available to: vendors (their submissions only)
 */
router.post(
  '/:tenderId/documents/upload',
  documentUploadController.upload.single('file'),
  documentUploadController.uploadDocument
);

/**
 * DELETE /api/tenders/:tenderId/documents/:submissionId
 * Remove an uploaded document
 * Available to: vendors (their documents only)
 */
router.delete(
  '/:tenderId/documents/:submissionId',
  documentUploadController.deleteDocument
);

export default router;
