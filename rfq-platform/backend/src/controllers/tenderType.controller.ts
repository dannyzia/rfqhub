// backend/src/controllers/tenderType.controller.ts
// Description: Handles HTTP requests for tender type operations
// Phase 2, Task 11

import { Request, Response, NextFunction } from 'express';
import * as tenderTypeService from '../services/tenderTypeSelector.service';
import * as valueValidationService from '../services/valueValidation.service';
import * as securityCalculationService from '../services/securityCalculation.service';

/**
 * GET /api/tender-types
 * List all tender types
 */
export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { procurementType } = req.query;
    const organizationType = req.user!.organizationType;  // From JWT

    const tenderTypes = await tenderTypeService.listTenderTypes(
      procurementType as string | undefined,
      organizationType  // NEW parameter
    );

    res.json({
      success: true,
      data: tenderTypes,
      count: tenderTypes.length
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/tender-types/:code
 * Get a specific tender type by code
 */
export async function getByCode(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = req.params;

    const tenderType = await tenderTypeService.getTenderTypeByCode(code);

    res.json({
      success: true,
      data: tenderType
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/tender-types/suggest
 * Suggest tender types based on procurement parameters
 *
 * Body: { procurementType, estimatedValue, isInternational?, etc. }
 */
export async function suggest(req: Request, res: Response, next: NextFunction) {
  try {
    // req.body is already validated by middleware using tenderTypeSuggestionSchema
    const suggestions = await tenderTypeService.suggestTenderType(req.body);

    res.json({
      success: true,
      data: suggestions,
      recommended: suggestions[0] // Top suggestion
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/tender-types/validate-value
 * Validate if a value is appropriate for a tender type
 *
 * Body: { value, tenderTypeCode }
 */
export async function validateValue(req: Request, res: Response, next: NextFunction) {
  try {
    const { value, tenderTypeCode } = req.body;

    const validation = await valueValidationService.validateTenderValue(value, tenderTypeCode);

    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/tender-types/calculate-securities
 * Calculate all security amounts for a tender
 *
 * Body: { tenderValue, tenderTypeCode }
 */
export async function calculateSecurities(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenderValue, tenderTypeCode } = req.body;

    const securities = await securityCalculationService.calculateSecurities(
      tenderTypeCode,
      tenderValue
    );

    res.json({
      success: true,
      data: securities
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/tender-types/ranges
 * Get value ranges for a procurement type with suggested tender types
 * Query: procurementType=goods|works|services
 */
export async function getValueRanges(req: Request, res: Response, next: NextFunction) {
  try {
    const { procurementType } = req.query;
    const organizationType = req.user!.organizationType;  // From JWT

    if (!procurementType || typeof procurementType !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'procurementType query parameter is required'
      });
    }

    if (!['goods', 'works', 'services'].includes(procurementType)) {
      return res.status(400).json({
        success: false,
        error: 'procurementType must be goods, works, or services'
      });
    }

    const ranges = await tenderTypeService.getValueRangesForProcurementType(
      procurementType as 'goods' | 'works' | 'services',
      organizationType  // NEW parameter
    );

    return res.json({
      success: true,
      data: ranges
    });
  } catch (error) {
    return next(error);
  }
}
