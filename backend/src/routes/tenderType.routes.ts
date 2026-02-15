// backend/src/routes/tenderType.routes.ts
// Description: Route definitions for tender type endpoints
// Phase 2, Task 13

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { validateTenderTypeMatchesOrgType } from '../middleware/organizationType.middleware';
import * as tenderTypeController from '../controllers/tenderType.controller';
import * as documentChecklistController from '../controllers/documentChecklist.controller';
import {
  tenderTypeSuggestionSchema,
  valueValidationSchema,
  securityCalculationSchema
} from '../schemas/tenderType.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================================================
// TENDER TYPE ENDPOINTS
// ============================================================================

/**
 * GET /api/tender-types
 * List all tender types (optionally filtered by procurement type)
 * Query params: ?procurementType=goods|works|services
 */
router.get('/', tenderTypeController.list);

/**
 * GET /api/tender-types/ranges
 * Get value ranges for a procurement type with suggested tender types
 * Query params: ?procurementType=goods|works|services
 */
router.get('/ranges', tenderTypeController.getValueRanges);

/**
 * GET /api/tender-types/:code
 * Get details of a specific tender type
 * Example: GET /api/tender-types/PG1
 */
router.get('/:code', tenderTypeController.getByCode);

/**
 * POST /api/tender-types/suggest
 * Get tender type suggestions based on procurement parameters
 * Body: { procurementType, estimatedValue, isInternational, etc. }
 */
router.post('/suggest', validate(tenderTypeSuggestionSchema), tenderTypeController.suggest);

/**
 * POST /api/tender-types/validate-value
 * Validate if a value is appropriate for a tender type
 * Body: { value, tenderTypeCode }
 */
router.post(
  '/validate-value',
  validate(valueValidationSchema),
  tenderTypeController.validateValue
);

/**
 * POST /api/tender-types/calculate-securities
 * Calculate tender security, performance security for a tender
 * Body: { tenderValue, tenderTypeCode }
 */
router.post(
  '/calculate-securities',
  validate(securityCalculationSchema),
  tenderTypeController.calculateSecurities
);

// ============================================================================
// DOCUMENT REQUIREMENTS ENDPOINTS
// ============================================================================

/**
 * GET /api/tender-types/:code/documents
 * Get required documents for a tender type
 */
router.get('/:code/documents', documentChecklistController.getRequiredDocuments);

export default router;
