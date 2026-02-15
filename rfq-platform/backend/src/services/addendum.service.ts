import { v4 as uuidv4 } from 'uuid';
import { pool, logger } from '../config';
import type { CreateAddendumInput } from '../schemas/addendum.schema';

interface AddendumRow {
  id: string;
  tender_id: string;
  addendum_number: number;
  title: string;
  description: string;
  extends_deadline_days: number | null;
  published_at: string;
  published_by: string;
}

interface AcknowledgementRow {
  addendum_id: string;
  vendor_org_id: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
}

export const addendumService = {
  async create(tenderId: string, input: CreateAddendumInput, userId: string, orgId: string): Promise<AddendumRow> {
    const tender = await pool.query(
      'SELECT id, status, buyer_org_id, submission_deadline FROM tenders WHERE id = $1',
      [tenderId]
    );

    if (tender.rows.length === 0) {
      throw Object.assign(new Error('Tender not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (tender.rows[0].buyer_org_id !== orgId) {
      throw Object.assign(new Error('Not authorized'), { statusCode: 403, code: 'FORBIDDEN' });
    }

    const allowedStatuses = ['published', 'clarification'];
    if (!allowedStatuses.includes(tender.rows[0].status)) {
      throw Object.assign(new Error('Addenda can only be added to published tenders'), { statusCode: 409, code: 'CONFLICT' });
    }

    const maxNumber = await pool.query(
      'SELECT COALESCE(MAX(addendum_number), 0) as max FROM addenda WHERE tender_id = $1',
      [tenderId]
    );
    const addendumNumber = maxNumber.rows[0].max + 1;

    const id = uuidv4();

    const { rows } = await pool.query<AddendumRow>(
      'INSERT INTO addenda (id, tender_id, addendum_number, title, description, extends_deadline_days, published_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, tenderId, addendumNumber, input.title, input.description, input.extendsDeadlineDays || null, userId]
    );

    if (input.extendsDeadlineDays && input.extendsDeadlineDays > 0) {
      await pool.query(
        "UPDATE tenders SET submission_deadline = submission_deadline + INTERVAL '1 day' * $1, updated_at = NOW() WHERE id = $2",
        [input.extendsDeadlineDays, tenderId]
      );
      logger.info('Tender deadline extended: tenderId=' + tenderId + ' extensionDays=' + input.extendsDeadlineDays);
    }

    if (tender.rows[0].status === 'open') {
      const vendors = await pool.query(
        "SELECT DISTINCT vp.organization_id FROM vendor_profiles vp WHERE vp.status = 'approved'"
      );

      for (const vendor of vendors.rows) {
        await pool.query(
          'INSERT INTO addendum_acknowledgements (addendum_id, vendor_org_id) VALUES ($1, $2) ON CONFLICT (addendum_id, vendor_org_id) DO NOTHING',
          [id, vendor.organization_id]
        );
      }
    } else {
      const invitations = await pool.query(
        'SELECT vendor_org_id FROM tender_vendor_invitations WHERE tender_id = $1',
        [tenderId]
      );

      for (const inv of invitations.rows) {
        await pool.query(
          'INSERT INTO addendum_acknowledgements (addendum_id, vendor_org_id) VALUES ($1, $2) ON CONFLICT (addendum_id, vendor_org_id) DO NOTHING',
          [id, inv.vendor_org_id]
        );
      }
    }

    logger.info('Addendum created: addendumId=' + id + ' tenderId=' + tenderId + ' addendumNumber=' + addendumNumber);
    return rows[0];
  },

  async findById(addendumId: string): Promise<AddendumRow | null> {
    const { rows } = await pool.query<AddendumRow>(
      'SELECT * FROM addenda WHERE id = $1',
      [addendumId]
    );
    return rows[0] || null;
  },

  async findByTenderId(tenderId: string): Promise<AddendumRow[]> {
    const { rows } = await pool.query<AddendumRow>(
      'SELECT * FROM addenda WHERE tender_id = $1 ORDER BY addendum_number ASC',
      [tenderId]
    );
    return rows;
  },

  async acknowledge(addendumId: string, vendorOrgId: string, userId: string): Promise<AcknowledgementRow> {
    const addendum = await this.findById(addendumId);

    if (!addendum) {
      throw Object.assign(new Error('Addendum not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    const existing = await pool.query(
      'SELECT * FROM addendum_acknowledgements WHERE addendum_id = $1 AND vendor_org_id = $2',
      [addendumId, vendorOrgId]
    );

    if (existing.rows.length === 0) {
      throw Object.assign(new Error('Vendor not eligible for this addendum'), { statusCode: 403, code: 'FORBIDDEN' });
    }

    if (existing.rows[0].acknowledged_at) {
      return existing.rows[0] as AcknowledgementRow;
    }

    const { rows } = await pool.query<AcknowledgementRow>(
      'UPDATE addendum_acknowledgements SET acknowledged_at = NOW(), acknowledged_by = $1 WHERE addendum_id = $2 AND vendor_org_id = $3 RETURNING *',
      [userId, addendumId, vendorOrgId]
    );

    logger.info('Addendum acknowledged: addendumId=' + addendumId + ' vendorOrgId=' + vendorOrgId + ' userId=' + userId);
    return rows[0];
  },

  async getAcknowledgementStatus(addendumId: string): Promise<AcknowledgementRow[]> {
    const { rows } = await pool.query<AcknowledgementRow>(
      'SELECT aa.*, o.name as vendor_name FROM addendum_acknowledgements aa JOIN organizations o ON o.id = aa.vendor_org_id WHERE aa.addendum_id = $1',
      [addendumId]
    );
    return rows;
  },

  async getUnacknowledgedByVendor(tenderId: string, vendorOrgId: string): Promise<AddendumRow[]> {
    const { rows } = await pool.query<AddendumRow>(
      'SELECT a.* FROM addenda a JOIN addendum_acknowledgements aa ON aa.addendum_id = a.id WHERE a.tender_id = $1 AND aa.vendor_org_id = $2 AND aa.acknowledged_at IS NULL ORDER BY a.addendum_number ASC',
      [tenderId, vendorOrgId]
    );
    return rows;
  },

  async hasUnacknowledgedAddenda(tenderId: string, vendorOrgId: string): Promise<boolean> {
    const unacknowledged = await this.getUnacknowledgedByVendor(tenderId, vendorOrgId);
    return unacknowledged.length > 0;
  },
};
