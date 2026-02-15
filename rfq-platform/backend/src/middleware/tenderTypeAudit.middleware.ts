// backend/src/middleware/tenderTypeAudit.middleware.ts
// Description: Audit logging middleware for tender type operations
// Phase 7, Task 33

import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import logger from '../config/logger';

interface AuditPayload {
  [key: string]: unknown;
}

/**
 * Log tender type selection for analytics
 */
export async function auditTenderTypeSelection(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Capture original json method
  const originalJson = res.json.bind(res);

  // Override json method to log after response
  res.json = function (body: Record<string, unknown>) {
    // Only log successful suggestions
    if (res.statusCode === 200 && body.success && (body as Record<string, unknown>).recommended) {
      const payload: AuditPayload = {
        user_id: (req.user as Record<string, unknown> | undefined)?.id || null,
        action: 'TENDER_TYPE_SUGGESTED',
        metadata: {
          input: req.body,
          suggested: (body.recommended as Record<string, unknown>).code,
          confidence: (body.recommended as Record<string, unknown>).confidence,
          alternativeCount: Array.isArray(body.data) ? body.data.length - 1 : 0
        }
      };

      // Async log (don't await, don't block response)
      pool
        .query(
          `INSERT INTO audit_logs (entity_type, action, user_id, metadata, created_at)
           VALUES ('tender_type', $1, $2, $3, NOW())`,
          [payload.action, payload.user_id, JSON.stringify(payload.metadata)]
        )
        .catch((err) => {
          logger.error(`Failed to audit tender type selection: ${err.message}`);
        });
    }

    return originalJson(body);
  };

  next();
}

/**
 * Log document checklist access
 */
export async function auditDocumentChecklistAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const originalJson = res.json.bind(res);

  res.json = function (body: Record<string, unknown>) {
    if (res.statusCode === 200 && body.success) {
      const payload: AuditPayload = {
        user_id: (req.user as Record<string, unknown> | undefined)?.id || null,
        tender_id: req.params.tenderId,
        action: 'DOCUMENT_CHECKLIST_VIEWED',
        metadata: {
          documentsRequired: ((body.data as Record<string, unknown>) || {}).mandatoryRequired || 0,
          documentsUploaded: ((body.data as Record<string, unknown>) || {}).uploaded || 0,
          isComplete: ((body.data as Record<string, unknown>) || {}).isComplete || false
        }
      };

      pool
        .query(
          `INSERT INTO audit_logs (entity_type, entity_id, action, user_id, metadata, created_at)
           VALUES ('tender', $1, $2, $3, $4, NOW())`,
          [payload.tender_id, payload.action, payload.user_id, JSON.stringify(payload.metadata)]
        )
        .catch((err) => {
          logger.error(`Failed to audit document checklist access: ${err.message}`);
        });
    }

    return originalJson(body);
  };

  next();
}

/**
 * Log document upload/submission
 */
export async function auditDocumentSubmission(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const originalJson = res.json.bind(res);

  res.json = function (body: Record<string, unknown>) {
    if (res.statusCode === 200 && body.success) {
      const payload: AuditPayload = {
        user_id: (req.user as Record<string, unknown> | undefined)?.id || null,
        tender_id: req.params.tenderId,
        action: 'DOCUMENT_SUBMITTED',
        metadata: {
          filename: ((body.data as Record<string, unknown>) || {}).filename || null,
          fileSize: ((body.data as Record<string, unknown>) || {}).file_size || null,
          mimeType: ((body.data as Record<string, unknown>) || {}).mime_type || null
        }
      };

      pool
        .query(
          `INSERT INTO audit_logs (entity_type, entity_id, action, user_id, metadata, created_at)
           VALUES ('tender', $1, $2, $3, $4, NOW())`,
          [payload.tender_id, payload.action, payload.user_id, JSON.stringify(payload.metadata)]
        )
        .catch((err) => {
          logger.error(`Failed to audit document submission: ${err.message}`);
        });
    }

    return originalJson(body);
  };

  next();
}
