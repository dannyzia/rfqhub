import { v4 as uuidv4 } from "uuid";
import { pool, logger } from "../config";
import type {
  CreateVendorProfileInput,
  UpdateVendorProfileInput,
  VendorStatusInput,
  UploadDocumentInput,
  AddCategoryInput,
} from "../schemas/vendor.schema";

interface VendorProfileRow {
  organization_id: string;
  legal_name: string;
  tax_id: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  status: string;
  status_changed_at: string;
  status_changed_by: string | null;
  rejection_reason: string | null;
  created_at: string;
}

interface VendorDocumentRow {
  id: string;
  vendor_org_id: string;
  document_type: string;
  file_url: string;
  issued_date: string | null;
  expiry_date: string | null;
  uploaded_at: string;
  uploaded_by: string;
}

interface VendorCategoryRow {
  vendor_org_id: string;
  category_id: string;
  added_at: string;
}

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["approved", "rejected"],
  approved: ["suspended"],
  rejected: ["pending"],
  suspended: ["approved", "rejected"],
};

export const vendorService = {
  async createProfile(
    orgId: string,
    input: CreateVendorProfileInput,
  ): Promise<VendorProfileRow> {
    const { rows } = await pool.query<VendorProfileRow>(
      `INSERT INTO vendor_profiles (
        organization_id, legal_name, tax_id, contact_name,
        contact_email, contact_phone, website, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *`,
      [
        orgId,
        input.legalName,
        input.taxId || null,
        input.contactName || null,
        input.contactEmail || null,
        input.contactPhone || null,
        input.website || null,
      ],
    );

    logger.info(`Vendor profile created: ${orgId}`);
    return rows[0];
  },

  async findProfileByOrgId(orgId: string): Promise<VendorProfileRow | null> {
    const { rows } = await pool.query<VendorProfileRow>(
      "SELECT * FROM vendor_profiles WHERE organization_id = $1",
      [orgId],
    );
    return rows[0] || null;
  },

  async findAllProfiles(status?: string): Promise<VendorProfileRow[]> {
    let query = "SELECT * FROM vendor_profiles";
    const params: string[] = [];

    if (status) {
      query += " WHERE status = $1";
      params.push(status);
    }

    query += " ORDER BY created_at DESC";

    const { rows } = await pool.query<VendorProfileRow>(query, params);
    return rows;
  },

  async updateProfile(
    orgId: string,
    input: UpdateVendorProfileInput,
  ): Promise<VendorProfileRow> {
    const profile = await this.findProfileByOrgId(orgId);

    if (!profile) {
      throw Object.assign(new Error("Vendor profile not found"), {
        statusCode: 404,
        code: "NOT_FOUND",
      });
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      legalName: "legal_name",
      taxId: "tax_id",
      contactName: "contact_name",
      contactEmail: "contact_email",
      contactPhone: "contact_phone",
      website: "website",
    };

    for (const [key, column] of Object.entries(fieldMap)) {
      if (key in input) {
        updates.push(`${column} = $${paramIndex}`);
        values.push((input as Record<string, unknown>)[key]);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return profile;
    }

    values.push(orgId);

    const { rows } = await pool.query<VendorProfileRow>(
      `UPDATE vendor_profiles SET ${updates.join(", ")} WHERE organization_id = $${paramIndex} RETURNING *`,
      values,
    );

    logger.info(`Vendor profile updated: ${orgId}`);
    return rows[0];
  },

  async changeStatus(
    orgId: string,
    input: VendorStatusInput,
    changedByUserId: string,
  ): Promise<VendorProfileRow> {
    const profile = await this.findProfileByOrgId(orgId);

    if (!profile) {
      throw Object.assign(new Error("Vendor profile not found"), {
        statusCode: 404,
        code: "NOT_FOUND",
      });
    }

    const allowed = VALID_STATUS_TRANSITIONS[profile.status] || [];
    if (!allowed.includes(input.status)) {
      throw Object.assign(
        new Error(
          `Cannot transition from ${profile.status} to ${input.status}`,
        ),
        { statusCode: 409, code: "CONFLICT" },
      );
    }

    if (input.status === "rejected" && !input.rejectionReason) {
      throw Object.assign(new Error("Rejection reason is required"), {
        statusCode: 400,
        code: "VALIDATION_ERROR",
      });
    }

    const { rows } = await pool.query<VendorProfileRow>(
      `UPDATE vendor_profiles
       SET status = $1, status_changed_at = NOW(), status_changed_by = $2, rejection_reason = $3
       WHERE organization_id = $4
       RETURNING *`,
      [input.status, changedByUserId, input.rejectionReason || null, orgId],
    );

    logger.info(
      `Vendor status changed: ${orgId} from ${profile.status} to ${input.status}`,
    );
    return rows[0];
  },

  async uploadDocument(
    orgId: string,
    input: UploadDocumentInput,
    uploadedByUserId: string,
  ): Promise<VendorDocumentRow> {
    const id = uuidv4();

    const { rows } = await pool.query<VendorDocumentRow>(
      `INSERT INTO vendor_documents (id, vendor_org_id, document_type, file_url, issued_date, expiry_date, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        id,
        orgId,
        input.documentType,
        input.fileUrl,
        input.issuedDate || null,
        input.expiryDate || null,
        uploadedByUserId,
      ],
    );

    logger.info(
      `Vendor document uploaded: ${input.documentType} for ${orgId} (${id})`,
    );
    return rows[0];
  },

  async findDocumentsByOrgId(orgId: string): Promise<VendorDocumentRow[]> {
    const { rows } = await pool.query<VendorDocumentRow>(
      "SELECT * FROM vendor_documents WHERE vendor_org_id = $1 ORDER BY uploaded_at DESC",
      [orgId],
    );
    return rows;
  },

  async deleteDocument(orgId: string, documentId: string): Promise<void> {
    const result = await pool.query(
      "DELETE FROM vendor_documents WHERE id = $1 AND vendor_org_id = $2",
      [documentId, orgId],
    );

    if (result.rowCount === 0) {
      throw Object.assign(new Error("Document not found"), {
        statusCode: 404,
        code: "NOT_FOUND",
      });
    }

    logger.info(`Vendor document deleted: ${documentId} for ${orgId}`);
  },

  async addCategory(
    orgId: string,
    input: AddCategoryInput,
  ): Promise<VendorCategoryRow> {
    const { rows } = await pool.query<VendorCategoryRow>(
      `INSERT INTO vendor_categories (vendor_org_id, category_id)
       VALUES ($1, $2)
       ON CONFLICT (vendor_org_id, category_id) DO NOTHING
       RETURNING *`,
      [orgId, input.categoryId],
    );

    if (rows.length === 0) {
      const existing = await pool.query<VendorCategoryRow>(
        "SELECT * FROM vendor_categories WHERE vendor_org_id = $1 AND category_id = $2",
        [orgId, input.categoryId],
      );
      return existing.rows[0];
    }

    logger.info(`Vendor category added: ${input.categoryId} to ${orgId}`);
    return rows[0];
  },

  async findCategoriesByOrgId(orgId: string): Promise<VendorCategoryRow[]> {
    const { rows } = await pool.query<VendorCategoryRow>(
      `SELECT vc.*, cm.name as category_name
       FROM vendor_categories vc
       JOIN categories_master cm ON cm.id = vc.category_id
       WHERE vc.vendor_org_id = $1
       ORDER BY cm.name`,
      [orgId],
    );
    return rows;
  },

  async removeCategory(orgId: string, categoryId: string): Promise<void> {
    await pool.query(
      "DELETE FROM vendor_categories WHERE vendor_org_id = $1 AND category_id = $2",
      [orgId, categoryId],
    );

    logger.info(`Vendor category removed: ${categoryId} from ${orgId}`);
  },
};
