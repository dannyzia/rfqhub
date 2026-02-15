import { v4 as uuidv4 } from "uuid";
import { pool, logger } from "../config";
import type {
  CreateAuditLogInput,
  AuditFilterInput,
  AuditAction,
  AuditEntityType,
} from "../schemas/audit.schema";

interface AuditLogRow {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown> | null;
  created_at: Date;
}

interface AuditLog {
  id: string;
  actorId: string | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

interface AuditLogWithActor extends AuditLog {
  actorName: string | null;
  actorEmail: string | null;
}

const mapRowToLog = (row: AuditLogRow): AuditLog => ({
  id: row.id,
  actorId: row.actor_id,
  action: row.action as AuditAction,
  entityType: row.entity_type as AuditEntityType,
  entityId: row.entity_id,
  metadata: row.metadata,
  createdAt: row.created_at,
});

export const auditService = {
  async log(input: CreateAuditLogInput): Promise<AuditLog> {
    const id = uuidv4();
    const { actorId, action, entityType, entityId, metadata } = input;

    const result = await pool.query<AuditLogRow>(
      `INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [
        id,
        actorId,
        action,
        entityType,
        entityId,
        metadata ? JSON.stringify(metadata) : null,
      ],
    );

    logger.debug("Audit log created", {
      auditId: id,
      action,
      entityType,
      entityId,
    });
    return mapRowToLog(result.rows[0]);
  },

  async logTenderCreated(
    actorId: string,
    tenderId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.log({
      actorId,
      action: "TENDER_CREATED",
      entityType: "tender",
      entityId: tenderId,
      metadata,
    });
  },

  async logTenderUpdated(
    actorId: string,
    tenderId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.log({
      actorId,
      action: "TENDER_UPDATED",
      entityType: "tender",
      entityId: tenderId,
      metadata,
    });
  },

  async logTenderPublished(actorId: string, tenderId: string): Promise<void> {
    await this.log({
      actorId,
      action: "TENDER_PUBLISHED",
      entityType: "tender",
      entityId: tenderId,
    });
  },

  async logTenderCancelled(
    actorId: string,
    tenderId: string,
    reason?: string,
  ): Promise<void> {
    await this.log({
      actorId,
      action: "TENDER_CANCELLED",
      entityType: "tender",
      entityId: tenderId,
      metadata: reason ? { reason } : undefined,
    });
  },

  async logBidSubmitted(
    actorId: string,
    bidId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.log({
      actorId,
      action: "BID_SUBMITTED",
      entityType: "bid",
      entityId: bidId,
      metadata,
    });
  },

  async logBidWithdrawn(actorId: string, bidId: string): Promise<void> {
    await this.log({
      actorId,
      action: "BID_WITHDRAWN",
      entityType: "bid",
      entityId: bidId,
    });
  },

  async logEnvelopeOpened(
    actorId: string,
    bidId: string,
    envelopeType: "technical" | "commercial",
  ): Promise<void> {
    await this.log({
      actorId,
      action: "ENVELOPE_OPENED",
      entityType: "bid",
      entityId: bidId,
      metadata: { envelopeType },
    });
  },

  async logEvaluationSubmitted(
    actorId: string,
    evaluationId: string,
    bidId: string,
  ): Promise<void> {
    await this.log({
      actorId,
      action: "EVALUATION_SUBMITTED",
      entityType: "evaluation",
      entityId: evaluationId,
      metadata: { bidId },
    });
  },

  async logAwardIssued(
    actorId: string,
    awardId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.log({
      actorId,
      action: "AWARD_ISSUED",
      entityType: "award",
      entityId: awardId,
      metadata,
    });
  },

  async logVendorStatusChange(
    actorId: string,
    vendorId: string,
    oldStatus: string,
    newStatus: string,
    reason?: string,
  ): Promise<void> {
    let action: AuditAction;
    switch (newStatus) {
      case "approved":
        action = "VENDOR_APPROVED";
        break;
      case "rejected":
        action = "VENDOR_REJECTED";
        break;
      case "suspended":
        action = "VENDOR_SUSPENDED";
        break;
      default:
        action = "VENDOR_APPROVED"; // Default fallback
    }

    await this.log({
      actorId,
      action,
      entityType: "vendor",
      entityId: vendorId,
      metadata: { oldStatus, newStatus, reason },
    });
  },

  async logUserLogin(userId: string, ipAddress?: string): Promise<void> {
    await this.log({
      actorId: userId,
      action: "USER_LOGIN",
      entityType: "user",
      entityId: userId,
      metadata: ipAddress ? { ipAddress } : undefined,
    });
  },

  async logUserLogout(userId: string): Promise<void> {
    await this.log({
      actorId: userId,
      action: "USER_LOGOUT",
      entityType: "user",
      entityId: userId,
    });
  },

  async getLogsForEntity(
    entityType: AuditEntityType,
    entityId: string,
  ): Promise<AuditLogWithActor[]> {
    const result = await pool.query<
      AuditLogRow & { actor_name: string | null; actor_email: string | null }
    >(
      `SELECT al.*, u.name as actor_name, u.email as actor_email
       FROM audit_logs al
       LEFT JOIN users u ON al.actor_id = u.id
       WHERE al.entity_type = $1 AND al.entity_id = $2
       ORDER BY al.created_at DESC`,
      [entityType, entityId],
    );

    return result.rows.map((row) => ({
      ...mapRowToLog(row),
      actorName: row.actor_name,
      actorEmail: row.actor_email,
    }));
  },

  async searchLogs(
    filter: AuditFilterInput,
  ): Promise<{ logs: AuditLogWithActor[]; total: number }> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (filter.actorId) {
      conditions.push(`al.actor_id = $${paramIndex++}`);
      values.push(filter.actorId);
    }
    if (filter.action) {
      conditions.push(`al.action = $${paramIndex++}`);
      values.push(filter.action);
    }
    if (filter.entityType) {
      conditions.push(`al.entity_type = $${paramIndex++}`);
      values.push(filter.entityType);
    }
    if (filter.entityId) {
      conditions.push(`al.entity_id = $${paramIndex++}`);
      values.push(filter.entityId);
    }
    if (filter.startDate) {
      conditions.push(`al.created_at >= $${paramIndex++}`);
      values.push(filter.startDate);
    }
    if (filter.endDate) {
      conditions.push(`al.created_at <= $${paramIndex++}`);
      values.push(filter.endDate);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM audit_logs al ${whereClause}`,
      values,
    );

    const result = await pool.query<
      AuditLogRow & { actor_name: string | null; actor_email: string | null }
    >(
      `SELECT al.*, u.name as actor_name, u.email as actor_email
       FROM audit_logs al
       LEFT JOIN users u ON al.actor_id = u.id
       ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...values, filter.limit, filter.offset],
    );

    return {
      logs: result.rows.map((row) => ({
        ...mapRowToLog(row),
        actorName: row.actor_name,
        actorEmail: row.actor_email,
      })),
      total: parseInt(countResult.rows[0].count),
    };
  },
};
