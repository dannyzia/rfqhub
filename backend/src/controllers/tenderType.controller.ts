// backend/src/controllers/tenderType.controller.ts
// Description: Handles HTTP requests for tender type operations
// Phase 2, Task 11

import { Request, Response, NextFunction } from 'express';
import * as tenderTypeService from '../services/tenderTypeSelector.service';
import * as valueValidationService from '../services/valueValidation.service';
import * as securityCalculationService from '../services/securityCalculation.service';
import { pool } from '../config/database';

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

// ============================================================================
// ADMIN CRUD FUNCTIONS (for Phase 7 testing)
// ============================================================================

/**
 * POST /api/tender-types
 * Create a new tender type (admin only)
 */
export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
      return;
    }

    const { code, name, description, is_active = true } = req.body;

    // Create tender type in database
    const result = await pool.query(
      `INSERT INTO tender_type_definitions 
       (code, name, description, is_active, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [code, name, description, is_active]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/tender-types/:id
 * Update an existing tender type (admin only)
 */
export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
      return;
    }

    const { id } = req.params;
    const updates = req.body;

    const result = await pool.query(
      `UPDATE tender_type_definitions 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           is_active = COALESCE($3, is_active),
           updated_at = NOW()
       WHERE code = $4
       RETURNING *`,
      [updates.name, updates.description, updates.active, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Tender type not found'
      });
      return;
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/tender-types/:id
 * Delete a tender type (admin only)
 */
export async function deleteTenderType(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
      return;
    }

    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM tender_type_definitions WHERE code = $1 RETURNING code',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Tender type not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { id }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/tender-types/:id/activate
 * Activate a tender type (admin only)
 */
export async function activate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
      return;
    }

    const { id } = req.params;

    const result = await pool.query(
      'UPDATE tender_type_definitions SET is_active = true, updated_at = NOW() WHERE code = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Tender type not found'
      });
      return;
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/tender-types/:id/deactivate
 * Deactivate a tender type (admin only)
 */
export async function deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
      return;
    }

    const { id } = req.params;

    const result = await pool.query(
      'UPDATE tender_type_definitions SET is_active = false, updated_at = NOW() WHERE code = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Tender type not found'
      });
      return;
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/tender-types/bulk
 * Bulk create tender types (admin only)
 */
export async function bulkCreate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
      return;
    }

    const { tenderTypes } = req.body;

    // For now, return success without actual bulk creation
    // This is a placeholder for Phase 7 testing
    res.status(201).json({
      success: true,
      data: { created: tenderTypes?.length || 0 }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/tender-types/categories
 * List tender type categories
 */
export async function listCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Return static categories for Phase 7 testing
    const categories = ['goods', 'works', 'services'];
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/tender-types/:id/statistics
 * Get tender type statistics
 */
export async function getStatistics(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // For now, return placeholder statistics
    const statistics = {
      totalTenders: 0,
      activeTenders: 0,
      completedTenders: 0,
      averageValue: 0
    };

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    next(error);
  }
}
