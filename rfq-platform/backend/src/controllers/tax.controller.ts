import { Request, Response, NextFunction } from "express";
import { taxService } from "../services/tax.service";
import { auditService } from "../services/audit.service";
import {
  createTaxRuleSchema,
  updateTaxRuleSchema,
  taxFilterSchema,
} from "../schemas/tax.schema";

export const taxController = {
  async createTaxRule(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const validated = createTaxRuleSchema.parse(req.body);
      const taxRule = await taxService.createTaxRule(validated);

      await auditService.log({
        actorId: req.user!.id,
        action: "TENDER_CREATED", // Reusing action, ideally add TAX_RULE_CREATED
        entityType: "tender",
        entityId: taxRule.id,
        metadata: { type: "tax_rule", name: taxRule.name },
      });

      res.status(201).json(taxRule);
    } catch (error) {
      next(error);
    }
  },

  async updateTaxRule(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { taxRuleId } = req.params;
      const validated = updateTaxRuleSchema.parse(req.body);
      const taxRule = await taxService.updateTaxRule(taxRuleId, validated);

      res.json(taxRule);
    } catch (error) {
      next(error);
    }
  },

  async getTaxRule(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { taxRuleId } = req.params;
      const taxRule = await taxService.getTaxRuleById(taxRuleId);

      if (!taxRule) {
        res.status(404).json({
          error: { code: "NOT_FOUND", message: "Tax rule not found" },
        });
        return;
      }

      res.json(taxRule);
    } catch (error) {
      next(error);
    }
  },

  async listTaxRules(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const filter = taxFilterSchema.parse(req.query);
      const taxRules = await taxService.listTaxRules(filter);

      res.json({ taxRules });
    } catch (error) {
      next(error);
    }
  },

  async deleteTaxRule(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { taxRuleId } = req.params;
      await taxService.deleteTaxRule(taxRuleId);

      res.json({ message: "Tax rule deactivated" });
    } catch (error) {
      next(error);
    }
  },

  async calculateTaxesForBid(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { bidId } = req.params;
      const { tenderId } = req.body;

      if (!tenderId) {
        res.status(400).json({
          error: { code: "VALIDATION_ERROR", message: "tenderId is required" },
        });
        return;
      }

      const result = await taxService.calculateBidItemTaxes(bidId, tenderId);

      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};
