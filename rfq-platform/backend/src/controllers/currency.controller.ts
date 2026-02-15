import { Request, Response, NextFunction } from "express";
import { currencyService } from "../services/currency.service";
import {
  currencyRateSchema,
  convertCurrencySchema,
  currencyFilterSchema,
} from "../schemas/currency.schema";

export const currencyController = {
  async refreshRates(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const updatedCount = await currencyService.fetchAndCacheRates();

      res.json({
        message: "Currency rates refreshed",
        updatedCount,
      });
    } catch (error) {
      next(error);
    }
  },

  async getRate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { baseCurrency, targetCurrency } = req.params;

      const rate = await currencyService.getRate(
        baseCurrency.toUpperCase(),
        targetCurrency.toUpperCase(),
      );

      if (!rate) {
        res.status(404).json({
          error: { code: "NOT_FOUND", message: "Exchange rate not found" },
        });
        return;
      }

      res.json(rate);
    } catch (error) {
      next(error);
    }
  },

  async listRates(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const filter = currencyFilterSchema.parse(req.query);
      const rates = await currencyService.listRates(filter);

      res.json({ rates });
    } catch (error) {
      next(error);
    }
  },

  async convertCurrency(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const validated = convertCurrencySchema.parse(req.body);
      const result = await currencyService.convertCurrency(validated);

      res.json({
        ...validated,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },

  async upsertRate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const validated = currencyRateSchema.parse(req.body);
      const rate = await currencyService.upsertRate(validated);

      res.json(rate);
    } catch (error) {
      next(error);
    }
  },

  async getRateAge(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { baseCurrency, targetCurrency } = req.params;

      const ageMinutes = await currencyService.getRateAge(
        baseCurrency.toUpperCase(),
        targetCurrency.toUpperCase(),
      );

      if (ageMinutes === null) {
        res.status(404).json({
          error: { code: "NOT_FOUND", message: "Exchange rate not found" },
        });
        return;
      }

      res.json({
        baseCurrency: baseCurrency.toUpperCase(),
        targetCurrency: targetCurrency.toUpperCase(),
        ageMinutes,
        isStale: ageMinutes > 1440, // More than 24 hours old
      });
    } catch (error) {
      next(error);
    }
  },
};
