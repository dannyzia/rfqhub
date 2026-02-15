import { pool, logger, redisClient } from "../config";
import type {
  CurrencyRateInput,
  ConvertCurrencyInput,
  CurrencyFilterInput,
} from "../schemas/currency.schema";

interface CurrencyRateRow {
  base_currency: string;
  target_currency: string;
  rate: string;
  fetched_at: Date;
}

interface CurrencyRate {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  fetchedAt: Date;
}

interface FXApiResponse {
  success: boolean;
  base: string;
  rates: Record<string, number>;
}

const CACHE_KEY_PREFIX = "fx_rate:";
const CACHE_TTL_SECONDS = 3600; // 1 hour
const BASE_CURRENCY = "USD";

const mapRowToRate = (row: CurrencyRateRow): CurrencyRate => ({
  baseCurrency: row.base_currency,
  targetCurrency: row.target_currency,
  rate: parseFloat(row.rate),
  fetchedAt: row.fetched_at,
});

export const currencyService = {
  async fetchAndCacheRates(): Promise<number> {
    try {
      // Fetch from free FX API
      const response = await fetch(
        `https://api.exchangerate.host/latest?base=${BASE_CURRENCY}`,
      );
      const data = (await response.json()) as FXApiResponse;

      if (!data.success || !data.rates) {
        throw new Error("Failed to fetch exchange rates from API");
      }

      let updatedCount = 0;

      for (const [targetCurrency, rate] of Object.entries(data.rates)) {
        // Upsert into database
        await pool.query(
          `INSERT INTO currency_rates (base_currency, target_currency, rate, fetched_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (base_currency, target_currency)
           DO UPDATE SET rate = $3, fetched_at = NOW()`,
          [BASE_CURRENCY, targetCurrency, rate],
        );

        // Cache in Redis
        const cacheKey = `${CACHE_KEY_PREFIX}${BASE_CURRENCY}:${targetCurrency}`;
        await redisClient.set(
          cacheKey,
          rate.toString(),
          "EX",
          CACHE_TTL_SECONDS,
        );

        updatedCount++;
      }

      logger.info("Currency rates updated", {
        updatedCount,
        base: BASE_CURRENCY,
      });
      return updatedCount;
    } catch (error) {
      logger.error("Failed to fetch currency rates", { error });
      throw error;
    }
  },

  async getRate(
    baseCurrency: string,
    targetCurrency: string,
  ): Promise<CurrencyRate | null> {
    // Check Redis cache first
    const cacheKey = `${CACHE_KEY_PREFIX}${baseCurrency}:${targetCurrency}`;
    const cachedRate = await redisClient.get(cacheKey);

    if (cachedRate) {
      return {
        baseCurrency,
        targetCurrency,
        rate: parseFloat(cachedRate),
        fetchedAt: new Date(),
      };
    }

    // Fallback to database
    const result = await pool.query<CurrencyRateRow>(
      "SELECT * FROM currency_rates WHERE base_currency = $1 AND target_currency = $2",
      [baseCurrency, targetCurrency],
    );

    if (result.rows.length === 0) {
      return null;
    }

    // Cache for future requests
    const rate = result.rows[0];
    await redisClient.set(cacheKey, rate.rate, "EX", CACHE_TTL_SECONDS);

    return mapRowToRate(rate);
  },

  async convertCurrency(
    input: ConvertCurrencyInput,
  ): Promise<{ convertedAmount: number; rate: number }> {
    const { amount, fromCurrency, toCurrency } = input;

    if (fromCurrency === toCurrency) {
      return { convertedAmount: amount, rate: 1 };
    }

    // If converting from non-USD, we need to go through USD
    let rate: number;

    if (fromCurrency === BASE_CURRENCY) {
      const rateData = await this.getRate(BASE_CURRENCY, toCurrency);
      if (!rateData) {
        throw new Error(
          `Exchange rate not found for ${fromCurrency} to ${toCurrency}`,
        );
      }
      rate = rateData.rate;
    } else if (toCurrency === BASE_CURRENCY) {
      const rateData = await this.getRate(BASE_CURRENCY, fromCurrency);
      if (!rateData) {
        throw new Error(
          `Exchange rate not found for ${fromCurrency} to ${toCurrency}`,
        );
      }
      rate = 1 / rateData.rate;
    } else {
      // Convert through USD: fromCurrency -> USD -> toCurrency
      const fromRate = await this.getRate(BASE_CURRENCY, fromCurrency);
      const toRate = await this.getRate(BASE_CURRENCY, toCurrency);

      if (!fromRate || !toRate) {
        throw new Error(
          `Exchange rate not found for ${fromCurrency} to ${toCurrency}`,
        );
      }

      rate = toRate.rate / fromRate.rate;
    }

    const convertedAmount = parseFloat((amount * rate).toFixed(2));

    logger.debug("Currency converted", {
      amount,
      fromCurrency,
      toCurrency,
      rate,
      convertedAmount,
    });
    return { convertedAmount, rate };
  },

  async listRates(filter: CurrencyFilterInput): Promise<CurrencyRate[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (filter.baseCurrency) {
      conditions.push(`base_currency = $${paramIndex++}`);
      values.push(filter.baseCurrency);
    }
    if (filter.targetCurrency) {
      conditions.push(`target_currency = $${paramIndex++}`);
      values.push(filter.targetCurrency);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await pool.query<CurrencyRateRow>(
      `SELECT * FROM currency_rates ${whereClause} ORDER BY target_currency ASC`,
      values,
    );

    return result.rows.map(mapRowToRate);
  },

  async upsertRate(input: CurrencyRateInput): Promise<CurrencyRate> {
    const { baseCurrency, targetCurrency, rate } = input;

    const result = await pool.query<CurrencyRateRow>(
      `INSERT INTO currency_rates (base_currency, target_currency, rate, fetched_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (base_currency, target_currency)
       DO UPDATE SET rate = $3, fetched_at = NOW()
       RETURNING *`,
      [baseCurrency, targetCurrency, rate],
    );

    // Update cache
    const cacheKey = `${CACHE_KEY_PREFIX}${baseCurrency}:${targetCurrency}`;
    await redisClient.set(cacheKey, rate.toString(), "EX", CACHE_TTL_SECONDS);

    logger.info("Currency rate upserted", {
      baseCurrency,
      targetCurrency,
      rate,
    });
    return mapRowToRate(result.rows[0]);
  },

  async getRateAge(
    baseCurrency: string,
    targetCurrency: string,
  ): Promise<number | null> {
    const result = await pool.query<{ fetched_at: Date }>(
      "SELECT fetched_at FROM currency_rates WHERE base_currency = $1 AND target_currency = $2",
      [baseCurrency, targetCurrency],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const ageMs = Date.now() - result.rows[0].fetched_at.getTime();
    return Math.floor(ageMs / 1000 / 60); // Return age in minutes
  },
};
