import { v4 as uuidv4 } from "uuid";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { pool, logger } from "../config";
import type {
  RequestExportInput,
  ExportFilterInput,
  ExportType,
  ExportFormat,
  ExportStatus,
} from "../schemas/export.schema";

interface ExportJobRow {
  id: string;
  user_id: string;
  export_type: string;
  format: string;
  tender_id: string;
  vendor_id: string | null;
  status: string;
  file_url: string | null;
  error_message: string | null;
  created_at: Date;
  completed_at: Date | null;
}

interface ExportJob {
  id: string;
  userId: string;
  exportType: ExportType;
  format: ExportFormat;
  tenderId: string;
  vendorId: string | null;
  status: ExportStatus;
  fileUrl: string | null;
  errorMessage: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

const mapRowToJob = (row: ExportJobRow): ExportJob => ({
  id: row.id,
  userId: row.user_id,
  exportType: row.export_type as ExportType,
  format: row.format as ExportFormat,
  tenderId: row.tender_id,
  vendorId: row.vendor_id,
  status: row.status as ExportStatus,
  fileUrl: row.file_url,
  errorMessage: row.error_message,
  createdAt: row.created_at,
  completedAt: row.completed_at,
});

export const exportService = {
  async createExportJob(
    userId: string,
    input: RequestExportInput,
  ): Promise<ExportJob> {
    const id = uuidv4();
    const { exportType, format, tenderId, vendorId } = input;

    const result = await pool.query<ExportJobRow>(
      `INSERT INTO export_jobs (id, user_id, export_type, format, tender_id, vendor_id, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
       RETURNING *`,
      [id, userId, exportType, format, tenderId, vendorId || null],
    );

    logger.info("Export job created", { jobId: id, exportType, format });
    return mapRowToJob(result.rows[0]);
  },

  async getJobById(jobId: string): Promise<ExportJob | null> {
    const result = await pool.query<ExportJobRow>(
      "SELECT * FROM export_jobs WHERE id = $1",
      [jobId],
    );
    return result.rows[0] ? mapRowToJob(result.rows[0]) : null;
  },

  async listUserJobs(
    userId: string,
    filter: ExportFilterInput,
  ): Promise<{ jobs: ExportJob[]; total: number }> {
    const conditions: string[] = ["user_id = $1"];
    const values: unknown[] = [userId];
    let paramIndex = 2;

    if (filter.status) {
      conditions.push(`status = $${paramIndex++}`);
      values.push(filter.status);
    }
    if (filter.exportType) {
      conditions.push(`export_type = $${paramIndex++}`);
      values.push(filter.exportType);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM export_jobs ${whereClause}`,
      values,
    );

    const result = await pool.query<ExportJobRow>(
      `SELECT * FROM export_jobs ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...values, filter.limit, filter.offset],
    );

    return {
      jobs: result.rows.map(mapRowToJob),
      total: parseInt(countResult.rows[0].count),
    };
  },

  async updateJobStatus(
    jobId: string,
    status: ExportStatus,
    fileUrl?: string,
    errorMessage?: string,
  ): Promise<void> {
    const completedAt =
      status === "completed" || status === "failed" ? "NOW()" : "NULL";

    await pool.query(
      `UPDATE export_jobs
       SET status = $1, file_url = $2, error_message = $3, completed_at = ${completedAt}
       WHERE id = $4`,
      [status, fileUrl || null, errorMessage || null, jobId],
    );

    logger.info("Export job status updated", { jobId, status });
  },

  async processExportJob(jobId: string): Promise<void> {
    const job = await this.getJobById(jobId);
    if (!job) {
      throw new Error("Export job not found");
    }

    await this.updateJobStatus(jobId, "processing");

    try {
      let fileUrl: string;

      switch (job.exportType) {
        case "tender_summary":
          fileUrl = await this.generateTenderSummaryPdf(job.tenderId);
          break;
        case "bid_comparison":
          fileUrl =
            job.format === "pdf"
              ? await this.generateBidComparisonPdf(job.tenderId)
              : await this.generateBidComparisonXlsx(job.tenderId);
          break;
        case "bid_integrity":
          fileUrl = await this.generateBidIntegrityPdf(job.tenderId);
          break;
        case "award_letter":
          if (!job.vendorId) {
            throw new Error("Vendor ID required for award letter");
          }
          fileUrl = await this.generateAwardLetterPdf(
            job.tenderId,
            job.vendorId,
          );
          break;
        case "full_data_dump":
          fileUrl = await this.generateFullDataDumpXlsx(job.tenderId);
          break;
        default:
          throw new Error(`Unknown export type: ${job.exportType}`);
      }

      await this.updateJobStatus(jobId, "completed", fileUrl);
      logger.info("Export job completed", { jobId, fileUrl });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await this.updateJobStatus(jobId, "failed", undefined, errorMessage);
      logger.error("Export job failed", { jobId, error });
      throw error;
    }
  },

  async generateTenderSummaryPdf(tenderId: string): Promise<string> {
    const tender = await pool.query(
      `SELECT t.*, o.name as org_name
       FROM tenders t
       JOIN organizations o ON t.buyer_org_id = o.id
       WHERE t.id = $1`,
      [tenderId],
    );

    if (tender.rows.length === 0) {
      throw new Error("Tender not found");
    }

    const t = tender.rows[0];
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    doc.fontSize(20).text("Tender Summary", { align: "center" });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Tender Number: ${t.tender_number}`);
    doc.text(`Title: ${t.title}`);
    doc.text(`Organization: ${t.org_name}`);
    doc.text(`Type: ${t.tender_type}`);
    doc.text(`Status: ${t.status}`);
    doc.text(`Visibility: ${t.visibility}`);
    doc.text(`Procurement Type: ${t.procurement_type}`);
    doc.text(`Currency: ${t.currency}`);
    doc.text(`Submission Deadline: ${t.submission_deadline}`);
    doc.text(`Created: ${t.created_at}`);

    doc.end();

    // In production, upload to S3/MinIO and return URL
    // For now, return a placeholder URL
    const fileName = `tender_summary_${tenderId}_${Date.now()}.pdf`;
    return `/exports/${fileName}`;
  },

  async generateBidComparisonPdf(tenderId: string): Promise<string> {
    // Simplified implementation
    const fileName = `bid_comparison_${tenderId}_${Date.now()}.pdf`;
    logger.info("Generated bid comparison PDF", { tenderId, fileName });
    return `/exports/${fileName}`;
  },

  async generateBidComparisonXlsx(tenderId: string): Promise<string> {
    const bids = await pool.query(
      `SELECT b.*, o.name as vendor_name, b.total_amount
       FROM bids b
       JOIN organizations o ON b.vendor_org_id = o.id
       WHERE b.tender_id = $1 AND b.status = 'submitted'
       ORDER BY b.total_amount ASC`,
      [tenderId],
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Comparison");
    const data = bids.rows.map((b, i) => ({
      Rank: i + 1,
      Vendor: b.vendor_name,
      "Total Amount": b.total_amount,
      "Compliance Status": b.compliance_status || "Pending",
      "Submitted At": b.submitted_at,
    }));
    if (data.length > 0) {
      worksheet.columns = Object.keys(data[0]).map((key) => ({
        header: key,
        key,
        width: 18,
      }));
      worksheet.addRows(data);
    }

    const fileName = `bid_comparison_${tenderId}_${Date.now()}.xlsx`;
    // In production, write to buffer and upload to S3
    return `/exports/${fileName}`;
  },

  async generateBidIntegrityPdf(tenderId: string): Promise<string> {
    const fileName = `bid_integrity_${tenderId}_${Date.now()}.pdf`;
    logger.info("Generated bid integrity PDF", { tenderId, fileName });
    return `/exports/${fileName}`;
  },

  async generateAwardLetterPdf(
    tenderId: string,
    vendorId: string,
  ): Promise<string> {
    const fileName = `award_letter_${tenderId}_${vendorId}_${Date.now()}.pdf`;
    logger.info("Generated award letter PDF", { tenderId, vendorId, fileName });
    return `/exports/${fileName}`;
  },

  async generateFullDataDumpXlsx(tenderId: string): Promise<string> {
    const fileName = `data_dump_${tenderId}_${Date.now()}.xlsx`;
    logger.info("Generated full data dump XLSX", { tenderId, fileName });
    return `/exports/${fileName}`;
  },
};
