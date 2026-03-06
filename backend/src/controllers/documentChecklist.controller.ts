// backend/src/controllers/documentChecklist.controller.ts
// Description: Handles document checklist and submission APIs
// Phase 2, Task 12

import { Request, Response, NextFunction } from "express";
import * as documentChecklistService from "../services/documentChecklist.service";
import logger from "../config/logger";

/**
 * GET /api/tender-types/:code/documents
 * Get required documents for a tender type
 */
export async function getRequiredDocuments(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { code } = req.params;

    const documents =
      await documentChecklistService.getDocumentRequirements(code);

    res.json({
      success: true,
      data: documents,
      tenderType: code,
      total: documents.length,
      mandatory: documents.filter((d) => d.is_mandatory).length,
    });
  } catch (error) {
    logger.error(
      `Error fetching required documents for code ${req.params.code}`,
    );
    return next(error);
  }
}

/**
 * GET /api/tenders/:tenderId/document-checklist
 * Get document checklist with submission status for current vendor
 */
export async function getDocumentChecklist(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { tenderId } = req.params;
    const vendorOrgId = req.user?.orgId;

    if (!vendorOrgId) {
      return res.status(403).json({
        success: false,
        error: {
          code: "NO_ORG",
          message: "User must belong to an organization",
        },
      });
    }

    const checklist = await documentChecklistService.getTenderChecklist(
      tenderId,
      vendorOrgId,
    );

    return res.json({
      success: true,
      data: checklist,
      tenderId,
    });
  } catch (error) {
    logger.error(
      `Error fetching document checklist for tender ${req.params.tenderId}`,
    );
    return next(error);
  }
}

/**
 * POST /api/tenders/:tenderId/documents/validate
 * Validate if all mandatory documents are uploaded and approved
 */
export async function validateDocumentCompleteness(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { tenderId } = req.params;
    const vendorOrgId = req.user?.orgId;

    if (!vendorOrgId) {
      return res.status(403).json({
        success: false,
        error: {
          code: "NO_ORG",
          message: "User must belong to an organization",
        },
      });
    }

    const checklist = await documentChecklistService.getTenderChecklist(
      tenderId,
      vendorOrgId,
    );

    // Check if all mandatory documents are approved
    const allMandatoryApproved = checklist.details
      .filter((d) => d.requirement.is_mandatory)
      .every((d) => d.status === "approved");

    const validation = {
      isComplete: allMandatoryApproved,
      mandatoryCount: checklist.mandatoryRequired,
      approvedCount: checklist.approved,
      missingCount: checklist.mandatoryRequired - checklist.approved,
      missingDocuments: checklist.details
        .filter((d) => d.requirement.is_mandatory && d.status !== "approved")
        .map((d) => ({
          code: d.requirement.document_code,
          name: d.requirement.document_name,
          status: d.status,
        })),
    };

    return res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    logger.error(
      `Error validating document completeness for tender ${req.params.tenderId}`,
    );
    return next(error);
  }
}

/**
 * GET /api/tenders/:tenderId/missing-documents
 * Get list of mandatory documents that still need to be uploaded
 */
export async function getMissingDocuments(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { tenderId } = req.params;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    const vendorOrgId = req.user.orgId;

    if (!vendorOrgId) {
      return res.status(403).json({
        success: false,
        error: {
          code: "NO_ORG",
          message: "User must belong to an organization",
        },
      });
    }

    const missingDocs =
      await documentChecklistService.getMissingMandatoryDocuments(
        tenderId,
        vendorOrgId,
      );

    return res.json({
      success: true,
      data: missingDocs,
      count: missingDocs.length,
      tenderId,
    });
  } catch (error) {
    logger.error(
      `Error fetching missing documents for tender ${req.params.tenderId}`,
    );
    return next(error);
  }
}
