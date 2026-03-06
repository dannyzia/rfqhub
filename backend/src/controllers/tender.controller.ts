import { Request, Response, NextFunction } from "express";
import { tenderService } from "../services/tender.service";
import { itemService } from "../services/item.service";
import type {
  CreateTenderInput,
  UpdateTenderInput,
  PublishTenderInput,
} from "../schemas/tender.schema";

/**
 * Map a raw DB TenderRow (snake_case) to the camelCase API response shape.
 * This ensures tests and API consumers receive consistent camelCase field names.
 */
function mapTenderRow(row: any) {
  return {
    id: row.id,
    referenceNumber: row.tender_number,
    title: row.title,
    description: row.description ?? null,
    status: row.status,
    organizationId: row.buyer_org_id,
    tenderType: row.tender_type,
    visibility: row.visibility,
    procurementType: row.procurement_type,
    currency: row.currency,
    priceBasis: row.price_basis,
    fundAllocation: row.fund_allocation ?? null,
    estimatedCost: row.estimated_cost ?? null,
    bidSecurityAmount: row.bid_security_amount ?? null,
    preBidMeetingDate: row.pre_bid_meeting_date ?? null,
    preBidMeetingLink: row.pre_bid_meeting_link ?? null,
    submissionDeadline: row.submission_deadline,
    bidOpeningTime: row.bid_opening_time ?? null,
    validityDays: row.validity_days,
    twoEnvelopeSystem: row.two_envelope_system ?? false,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const tenderController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateTenderInput;
      const user = req.user as any;
      const tender = await tenderService.create(
        input,
        user.id.toString(),
        user.companyId?.toString() || user.id.toString(),
      );
      res.status(201).json({ data: mapTenderRow(tender) });
    } catch (err) {
      next(err);
    }
  },

  async findAll(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = req.user as any;
      const role =
        user.role === "buyer" || user.role === "admin" ? "buyer" : "vendor";

      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const status = req.query.status as string | undefined;

      const { rows, total } = await tenderService.findAll(
        user.companyId?.toString() || user.id.toString(),
        role,
        { page, limit, status },
      );

      const data = rows.map(mapTenderRow);

      if (page !== undefined || limit !== undefined) {
        const effectivePage = page ?? 1;
        const effectiveLimit = limit ?? 20;
        res.status(200).json({
          data,
          pagination: {
            page: effectivePage,
            limit: effectiveLimit,
            total,
          },
        });
      } else {
        res.status(200).json({ data });
      }
    } catch (err) {
      next(err);
    }
  },

  async findById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user as any;

      // Validate UUID format — non-UUID ids cause PG error 22P02 (invalid_text_representation)
      const UUID_REGEX =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!UUID_REGEX.test(id)) {
        res
          .status(404)
          .json({ error: { code: "NOT_FOUND", message: "Tender not found" } });
        return;
      }

      const tender = await tenderService.findById(id);

      if (!tender) {
        res
          .status(404)
          .json({ error: { code: "NOT_FOUND", message: "Tender not found" } });
        return;
      }

      // Fetch associated items so the response always includes them
      const items = await itemService.findByTenderId(id);

      const isOwner =
        tender.buyer_org_id === user.companyId?.toString() ||
        user.id.toString();
      const isVendor = user.role === "vendor";

      if (isVendor && !isOwner) {
        const mapped = mapTenderRow(tender);
        const response = {
          ...mapped,
          items,
          fundAllocation: undefined,
          estimatedCost: undefined,
        };
        res.status(200).json({ data: response });
        return;
      }

      res.status(200).json({ data: { ...mapTenderRow(tender), items } });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const input = req.body as UpdateTenderInput;
      const user = req.user as any;
      const tender = await tenderService.update(
        id,
        input,
        user.companyId?.toString() || user.id.toString(),
      );
      res.status(200).json({ data: mapTenderRow(tender) });
    } catch (err) {
      next(err);
    }
  },

  async publish(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const input = req.body as PublishTenderInput;
      const user = req.user as any;
      const tender = await tenderService.publish(
        id,
        user.companyId?.toString() || user.id.toString(),
        input.invitedVendorIds,
      );
      res.status(200).json({ data: mapTenderRow(tender) });
    } catch (err) {
      next(err);
    }
  },

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user as any;
      const tender = await tenderService.cancel(
        id,
        user.companyId?.toString() || user.id.toString(),
      );
      res.status(200).json({ data: mapTenderRow(tender) });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user as any;
      await tenderService.delete(
        id,
        user.companyId?.toString() || user.id.toString(),
      );
      res
        .status(200)
        .json({ data: { message: "Tender deleted successfully" } });
    } catch (err) {
      next(err);
    }
  },
};
