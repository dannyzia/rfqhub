import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { pool } from "../config/database";
import { currencyService } from "../services/currency.service";
import { convertCurrencySchema } from "../schemas/currency.schema";
import { ZodError } from "zod";

const router = Router();

router.use(authenticate);

// ─── GET /api/currencies ──────────────────────────────────────────────────────
// Returns list of supported currencies: [{ code, name, symbol }]
router.get(
  "/",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currencies = await currencyService.getSupportedCurrencies();
      res.status(200).json({ data: currencies });
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /api/currencies/rates?base=USD ───────────────────────────────────────
// Returns exchange rates for a base currency: { base, rates: { [code]: number } }
router.get(
  "/rates",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const base = (req.query.base as string | undefined)?.toUpperCase();

      if (!base) {
        res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "base query parameter is required",
          },
        });
        return;
      }

      // Validate currency code length (ISO 4217 = 3 chars)
      if (base.length !== 3) {
        res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid currency code. Must be a 3-letter ISO 4217 code.",
          },
        });
        return;
      }

      // Query all rates where base_currency = base
      const result = await pool.query<{
        target_currency: string;
        rate: string;
      }>(
        "SELECT target_currency, rate FROM currency_rates WHERE base_currency = $1 ORDER BY target_currency ASC",
        [base],
      );

      if (result.rows.length === 0) {
        // No rates found for this base — might be an invalid currency code
        res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: `No exchange rates found for currency code: ${base}`,
          },
        });
        return;
      }

      // Transform array to { [targetCurrency]: rate } map
      const rates: Record<string, number> = {};
      for (const row of result.rows) {
        rates[row.target_currency] = parseFloat(row.rate);
      }

      res.status(200).json({ data: { base, rates } });
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /api/currencies/:code ────────────────────────────────────────────────
// Returns details for a single currency code
router.get(
  "/:code",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const code = req.params.code.toUpperCase();

      const result = await pool.query<{
        code: string;
        name: string;
        symbol: string;
      }>(
        "SELECT code, name, symbol FROM currencies WHERE code = $1",
        [code],
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          error: { code: "NOT_FOUND", message: `Currency '${code}' not found` },
        });
        return;
      }

      res.status(200).json({ data: result.rows[0] });
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /api/currencies/convert ────────────────────────────────────────────
// Body: { amount, fromCurrency, toCurrency }
// Response: { data: { amount, convertedAmount, fromCurrency, toCurrency, rate } }
router.post(
  "/convert",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = convertCurrencySchema.parse(req.body);
      const { amount, fromCurrency, toCurrency } = validated;

      const { convertedAmount, rate } =
        await currencyService.convertCurrency(validated);

      res.status(200).json({
        data: {
          amount,
          convertedAmount,
          fromCurrency: fromCurrency.toUpperCase(),
          toCurrency: toCurrency.toUpperCase(),
          rate,
        },
      });
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: err.errors.map((e) => e.message).join("; "),
          },
        });
        return;
      }
      next(err);
    }
  },
);

export { router as currencyRoutes };
