// backend/src/services/documentChecklist.service.ts
// Description: Manage document requirements and submissions for tender types
// Phase 1, Task 9

import pool from '../config/database';
import logger from '../config/logger';
import * as tenderTypeService from './tenderTypeSelector.service';

export interface DocumentRequirement {
  id: string;
  tender_type_code: string;
  document_code: string;
  document_name: string;
  category: string;
  is_mandatory: boolean;
  description?: string;
  file_format_allowed?: string[];
  max_file_size_mb?: number;
  instruction?: string;
}

export interface DocumentSubmission {
  id: string;
  tender_id: string;
  vendor_org_id: string;
  document_requirement_id: string;
  document_name: string;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  uploaded_by: string;
  verified_at?: string;
  is_verified: boolean;
  verified_by?: string;
}

export interface ChecklistStatus {
  tenderTypeCode: string;
  totalRequired: number;
  mandatoryRequired: number;
  optionalAvailable: number;
  submitted: number;
  approved: number;
  pending: number;
  rejected?: number;
  completionPercentage: number;
  details: Array<{
    requirement: DocumentRequirement;
    submission?: DocumentSubmission;
    status: 'not-submitted' | 'submitted' | 'approved';
  }>;
}

/**
 * Get all document requirements for a tender type
 */
export async function getDocumentRequirements(
  tenderTypeCode: string
): Promise<DocumentRequirement[]> {
  try {
    // Verify tender type exists
    await tenderTypeService.getTenderTypeByCode(tenderTypeCode);

    // Fetch document requirements
    const result = await pool.query(
      `SELECT 
        id,
        tender_type_code,
        document_code,
        document_name,
        document_category as category,
        is_mandatory,
        description,
        allowed_file_formats as file_format_allowed,
        max_file_size_mb,
        description as instruction
       FROM tender_type_document_requirements
       WHERE tender_type_code = $1
       ORDER BY is_mandatory DESC, document_code ASC`,
      [tenderTypeCode]
    );

    return result.rows;
  } catch (error) {
    logger.error(`Error fetching document requirements for tender type ${tenderTypeCode}`);
    throw error;
  }
}

/**
 * Get checklist status for a tender
 */
export async function getTenderChecklist(
  tenderId: string,
  vendorOrgId: string
): Promise<ChecklistStatus> {
  try {
    // Fetch tender details to get tender type
    const tender = await pool.query(
      `SELECT tender_type FROM tenders WHERE id = $1`,
      [tenderId]
    );

    if (tender.rows.length === 0) {
      throw new Error('Tender not found');
    }

    const tenderTypeCode = tender.rows[0].tender_type;

    if (!tenderTypeCode) {
      throw new Error('Tender type not set');
    }

    // Get all required documents for this tender type
    const requirements = await getDocumentRequirements(tenderTypeCode);

    // Get all submissions for this tender by this vendor
    const submissions = await pool.query(
      `SELECT 
        ds.id,
        ds.tender_id,
        ds.vendor_org_id,
        ds.document_requirement_id,
        ds.filename,
        ds.file_path,
        ds.file_size,
        ds.mime_type,
        ds.uploaded_at,
        ds.uploaded_by,
        ds.verified_at,
        ds.is_verified,
        ds.verified_by,
        dr.document_name
       FROM tender_document_submissions ds
       JOIN tender_type_document_requirements dr ON ds.document_requirement_id = dr.id
       WHERE ds.tender_id = $1 AND ds.vendor_org_id = $2
       ORDER BY dr.document_code ASC`,
      [tenderId, vendorOrgId]
    );

    // Build checklist
    let submitted = 0;
    let approved = 0;
    let pending = 0;

    const details = requirements.map((req) => {
      const submission = submissions.rows.find((s: any) => s.document_requirement_id === req.id);
      let status: 'not-submitted' | 'submitted' | 'approved' = 'not-submitted';

      if (submission) {
        status = submission.is_verified ? 'approved' : 'submitted';
        submitted++;

        if (submission.is_verified) {
          approved++;
        } else {
          pending++;
        }
      }

      return {
        requirement: req,
        submission: submission || undefined,
        status
      };
    });

    const mandatoryRequired = requirements.filter((r) => r.is_mandatory).length;
    const completionPercentage = approved > 0 ? Math.round((approved / mandatoryRequired) * 100) : 0;

    return {
      tenderTypeCode,
      totalRequired: requirements.length,
      mandatoryRequired,
      optionalAvailable: requirements.length - mandatoryRequired,
      submitted,
      approved,
      pending,
      rejected: 0,
      completionPercentage,
      details
    };
  } catch (error) {
    logger.error(`Error fetching tender checklist for tender ${tenderId}`);
    throw error;
  }
}

/**
 * Record a document submission
 */
export async function recordDocumentSubmission(
  tenderId: string,
  vendorOrgId: string,
  documentRequirementId: string,
  filename: string,
  filePath: string,
  fileSize: number,
  mimeType: string,
  uploadedBy: string
): Promise<DocumentSubmission> {
  try {
    const result = await pool.query(
      `INSERT INTO tender_document_submissions (
        tender_id,
        vendor_org_id,
        document_requirement_id,
        filename,
        file_path,
        file_size,
        mime_type,
        uploaded_by,
        is_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE)
      ON CONFLICT (tender_id, vendor_org_id, document_requirement_id)
      DO UPDATE SET
        filename = EXCLUDED.filename,
        file_path = EXCLUDED.file_path,
        file_size = EXCLUDED.file_size,
        mime_type = EXCLUDED.mime_type,
        uploaded_by = EXCLUDED.uploaded_by,
        uploaded_at = NOW(),
        is_verified = FALSE,
        verified_at = NULL,
        verified_by = NULL,
        updated_at = NOW()
      RETURNING *`,
      [
        tenderId,
        vendorOrgId,
        documentRequirementId,
        filename,
        filePath,
        fileSize,
        mimeType,
        uploadedBy
      ]
    );

    logger.info(`Document submitted for tender ${tenderId}`);

    return result.rows[0];
  } catch (error) {
    logger.error(`Error recording document submission for tender ${tenderId}`);
    throw error;
  }
}

/**
 * Verify a submitted document
 */
export async function verifyDocument(
  submissionId: string,
  status: 'approved' | 'rejected',
  notes?: string
): Promise<DocumentSubmission> {
  try {
    const result = await pool.query(
      `UPDATE tender_document_submissions
       SET verification_status = $1,
           verification_notes = $2,
           verified_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, notes || null, submissionId]
    );

    if (result.rows.length === 0) {
      throw new Error('Submission not found');
    }

    logger.info(`Document verified: ${submissionId}`);

    return result.rows[0];
  } catch (error) {
    logger.error(`Error verifying document ${submissionId}`);
    throw error;
  }
}

/**
 * Get mandatory documents that are still missing for a tender
 */
export async function getMissingMandatoryDocuments(
  tenderId: string,
  vendorOrgId: string
): Promise<DocumentRequirement[]> {
  try {
    const result = await pool.query(
      `SELECT DISTINCT dr.*
       FROM tender_type_document_requirements dr
       JOIN tenders t ON t.tender_type = dr.tender_type_code
       WHERE t.id = $1
       AND dr.is_mandatory = TRUE
       AND dr.is_active = TRUE
       AND NOT EXISTS (
         SELECT 1 FROM tender_document_submissions
         WHERE tender_id = t.id
         AND vendor_org_id = $2
         AND document_requirement_id = dr.id
         AND verification_status = 'approved'
       )
       ORDER BY dr.document_code ASC`,
      [tenderId, vendorOrgId]
    );

    return result.rows;
  } catch (error) {
    logger.error(`Error fetching missing documents for tender ${tenderId}`);
    throw error;
  }
}

/**
 * Format checklist for display
 */
export function formatChecklistDisplay(checklist: ChecklistStatus): string {
  const lines: string[] = [];

  lines.push(`Document Checklist - ${checklist.tenderTypeCode}`);
  lines.push(
    `Progress: ${checklist.approved}/${checklist.mandatoryRequired} required documents approved (${checklist.completionPercentage}%)`
  );
  lines.push('');

  for (const item of checklist.details) {
    const req = item.requirement;
    const mandatory = req.is_mandatory ? '✓' : '○';
    const statusIcon =
      item.status === 'approved'
        ? '✅'
        : item.status === 'submitted'
          ? '⏳'
          : '⭕';

    lines.push(
      `${mandatory} ${statusIcon} ${req.document_code}: ${req.document_name}`
    );
  }

  return lines.join('\n');
}
