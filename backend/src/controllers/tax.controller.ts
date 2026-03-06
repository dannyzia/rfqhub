import { Request, Response, NextFunction } from "express";
import { taxService } from "../services/tax.service";
import { auditService } from "../services/audit.service";
import {
  createTaxRuleSchema,
  updateTaxRuleSchema,
  taxFilterSchema,
  createTaxRateSchema,
  updateTaxRateSchema,
  taxRateFilterSchema,
  calculateTaxSchema,
} from "../schemas/tax.schema";

export const taxController = {
  // ------------------------------------------------------------------------
  // TAX RULES METHODS (existing - procurement type-based)
  // ------------------------------------------------------------------------

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

  // ------------------------------------------------------------------------
  // TAX RATES METHODS (new - jurisdiction-based with Redis caching)
  // ------------------------------------------------------------------------

  async createTaxRate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const validated = createTaxRateSchema.parse(req.body);
      const taxRate = await taxService.createTaxRate(validated, req.user?.id);

      res.status(201).json(taxRate);
    } catch (error) {
      next(error);
    }
  },

  async updateTaxRate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { taxRateId } = req.params;
      const validated = updateTaxRateSchema.parse(req.body);
      const taxRate = await taxService.updateTaxRate(taxRateId, validated, req.user?.id);

      res.json(taxRate);
    } catch (error) {
      next(error);
    }
  },

  async getTaxRate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { taxRateId } = req.params;
      const taxRate = await taxService.getTaxRateById(taxRateId);

      if (!taxRate) {
        res.status(404).json({
          error: { code: "NOT_FOUND", message: "Tax rate not found" },
        });
        return;
      }

      res.json(taxRate);
    } catch (error) {
      next(error);
    }
  },

  async listTaxRates(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const filter = taxRateFilterSchema.parse(req.query);
      const taxRates = await taxService.listTaxRates(filter);

      res.json({ taxRates });
    } catch (error) {
      next(error);
    }
  },

  async getTaxRateForJurisdiction(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { country, state, taxType } = req.query as {
        country?: string;
        state?: string;
        taxType?: string;
      };

      if (!country) {
        res.status(400).json({
          error: { code: "VALIDATION_ERROR", message: "country query parameter is required" },
        });
        return;
      }

      const taxRate = await taxService.getTaxRateForJurisdiction(
        country.toUpperCase(),
        state?.toUpperCase(),
        taxType,
      );

      if (!taxRate) {
        res.status(404).json({
          error: { code: "NOT_FOUND", message: "Tax rate not found for this jurisdiction" },
        });
        return;
      }

      res.json(taxRate);
    } catch (error) {
      next(error);
    }
  },

  async calculateTax(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const validated = calculateTaxSchema.parse(req.body);
      const result = await taxService.calculateTax(validated);

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async deleteTaxRate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { taxRateId } = req.params;
      await taxService.deleteTaxRate(taxRateId, req.user?.id);

      res.json({ message: "Tax rate deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
};
