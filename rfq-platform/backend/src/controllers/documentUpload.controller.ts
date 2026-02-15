// backend/src/controllers/documentUpload.controller.ts
// Description: Handle document uploads for tender submissions

import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database';
import logger from '../config/logger';
import fs from 'fs';

// Extend Express Request to include file property
declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
    }
  }
}

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads/tender-documents';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const storage = multer.diskStorage({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  destination: (_req: any, _file: any, cb: any): void => {
    cb(null, uploadDir);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filename: (_req: any, file: any, cb: any): void => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fileFilter = (_req: any, file: any, cb: multer.FileFilterCallback): void => {
  const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.xls', '.xlsx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${ext} not allowed. Allowed: ${allowedTypes.join(', ')}`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * POST /api/tenders/:tenderId/documents/upload
 * Upload a document for a specific requirement
 */
export async function uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
  const client = await pool.connect();

  try {
    const { tenderId } = req.params;
    const { documentRequirementId } = req.body;
    // @ts-ignore
    const vendorOrgId = req.user.orgId;
    // @ts-ignore
    const userId = req.user.id;
    const uploadedFile = req.file;

    if (!uploadedFile) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No file uploaded' }
      });
      return;
    }

    if (!vendorOrgId) {
      res.status(403).json({
        success: false,
        error: { code: 'NO_ORG', message: 'User must belong to an organization' }
      });
      return;
    }

    await client.query('BEGIN');

    // Step 1: Verify tender exists and is accepting submissions
    const tenderCheck = await client.query(
      `SELECT id, status, submission_deadline FROM tenders WHERE id = $1`,
      [tenderId]
    );

    if (tenderCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({
        success: false,
        error: { code: 'TENDER_NOT_FOUND', message: 'Tender not found' }
      });
      return;
    }

    const tender = tenderCheck.rows[0];

    if (new Date(tender.submission_deadline) < new Date()) {
      await client.query('ROLLBACK');
      res.status(400).json({
        success: false,
        error: { code: 'DEADLINE_PASSED', message: 'Submission deadline has passed' }
      });
      return;
    }

    if (!['open', 'published'].includes(tender.status)) {
      await client.query('ROLLBACK');
      res.status(400).json({
        success: false,
        error: { code: 'TENDER_NOT_OPEN', message: 'Tender is not accepting submissions' }
      });
      return;
    }

    // Step 2: Verify document requirement exists
    const reqCheck = await client.query(
      `SELECT id, is_mandatory FROM tender_type_document_requirements WHERE id = $1`,
      [documentRequirementId]
    );

    if (reqCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({
        success: false,
        error: { code: 'REQUIREMENT_NOT_FOUND', message: 'Document requirement not found' }
      });
      return;
    }

    // Step 3: Insert or update submission
    const existingSubmission = await client.query(
      `SELECT id FROM tender_document_submissions
       WHERE tender_id = $1 AND vendor_org_id = $2 AND document_requirement_id = $3`,
      [tenderId, vendorOrgId, documentRequirementId]
    );

    let submissionId: string;

    if (existingSubmission.rows.length > 0) {
      // Update existing
      submissionId = existingSubmission.rows[0].id;
      await client.query(
        `UPDATE tender_document_submissions
         SET filename = $1, file_path = $2, file_size = $3, mime_type = $4,
             uploaded_at = NOW(), uploaded_by = $5
         WHERE id = $6`,
        [
          uploadedFile.originalname,
          uploadedFile.path,
          uploadedFile.size,
          uploadedFile.mimetype,
          userId,
          submissionId
        ]
      );
    } else {
      // Insert new
      submissionId = uuidv4();
      await client.query(
        `INSERT INTO tender_document_submissions (
          id, tender_id, vendor_org_id, document_requirement_id,
          filename, file_path, file_size, mime_type,
          uploaded_at, uploaded_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)`,
        [
          submissionId,
          tenderId,
          vendorOrgId,
          documentRequirementId,
          uploadedFile.originalname,
          uploadedFile.path,
          uploadedFile.size,
          uploadedFile.mimetype,
          userId
        ]
      );
    }

    // Step 4: Audit log
    await client.query(
      `INSERT INTO audit_logs (entity_type, entity_id, action, user_id, metadata)
       VALUES ('tender_document', $1, 'DOCUMENT_UPLOADED', $2, $3)`,
      [
        submissionId,
        userId,
        JSON.stringify({
          tenderId,
          documentRequirementId,
          filename: uploadedFile.originalname,
          fileSize: uploadedFile.size
        })
      ]
    );

    await client.query('COMMIT');

    // Log successful upload
    if (logger) {
      try {
        logger.info(`Document uploaded: ${uploadedFile.originalname}`);
      } catch (_e) {
        // Ignore logger errors
      }
    }

    res.json({
      success: true,
      data: {
        id: submissionId,
        filename: uploadedFile.originalname,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (_err) {
      // Ignore rollback errors
    }
    if (logger) {
      try {
        logger.error(`Document upload failed: ${error instanceof Error ? error.message : String(error)}`);
      } catch (_e) {
        // Ignore logger errors
      }
    }
    next(error);
  } finally {
    client.release();
  }
}

/**
 * DELETE /api/tenders/:tenderId/documents/:submissionId
 * Remove an uploaded document
 */
export async function deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tenderId, submissionId } = req.params;
    // @ts-ignore
    const vendorOrgId = req.user.orgId;

    const result = await pool.query(
      `DELETE FROM tender_document_submissions
       WHERE id = $1 AND tender_id = $2 AND vendor_org_id = $3
       RETURNING id, filename`,
      [submissionId, tenderId, vendorOrgId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found or not authorized' }
      });
      return;
    }

    // Log successful deletion
    if (logger) {
      try {
        logger.info(`Document deleted: ${result.rows[0].filename}`);
      } catch (_e) {
        // Ignore logger errors
      }
    }

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    if (logger) {
      try {
        logger.error(`Document deletion failed: ${error instanceof Error ? error.message : String(error)}`);
      } catch (_e) {
        // Ignore logger errors
      }
    }
    next(error);
  }
}
