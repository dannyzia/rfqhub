import { currencyService } from "../currency.service";

jest.mock("../../config/database");

// Mock the full config module so redisClient and logger are Jest spies
jest.mock("../../config", () => ({
  pool: { query: jest.fn() },
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
  redisClient: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue("OK"),
  },
}));

// We need to access the mocked pool from the config module (not database directly)
// currency.service imports pool from ../config, so we grab it from there
import { pool as configPool, redisClient } from "../../config";

describe("CurrencyService", () => {
  let mockQuery: jest.Mock;
  let mockRedisGet: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = (configPool as any).query as jest.Mock;
    mockRedisGet = (redisClient as any).get as jest.Mock;
    // Default: cache miss (null), so service falls through to DB
    mockRedisGet.mockResolvedValue(null);
  });

  describe("getRate", () => {
    it("should return exchange rate when found in database", async () => {
      const mockRow = {
        base_currency: "USD",
        target_currency: "BDT",
        rate: "110.5",
        fetched_at: new Date("2024-01-01"),
      };

      mockQuery.mockResolvedValue({
        rows: [mockRow],
        rowCount: 1,
      });

      const result = await currencyService.getRate("USD", "BDT");

      expect(result).toBeDefined();
      expect(result).toEqual({
        baseCurrency: "USD",
        targetCurrency: "BDT",
        rate: 110.5,
        fetchedAt: mockRow.fetched_at,
      });
      expect(mockQuery).toHaveBeenCalled();
    });

    it("should return cached rate from Redis when available", async () => {
      mockRedisGet.mockResolvedValue("110.5");

      const result = await currencyService.getRate("USD", "BDT");

      expect(result).toBeDefined();
      expect(result).toEqual({
        baseCurrency: "USD",
        targetCurrency: "BDT",
        rate: 110.5,
        fetchedAt: expect.any(Date),
      });
      // Should NOT hit the database when cache is warm
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("should return null when rate is not found", async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await currencyService.getRate("INVALID", "BDT");

      expect(result).toBeNull();
    });
  });

  describe("convertCurrency", () => {
    it("should convert amount between currencies and return { convertedAmount, rate }", async () => {
      // INVALID -> BDT: goes through USD. Need USD->INVALID and USD->BDT rates.
      // For USD->USD no cross needed; test USD->BDT directly.
      const mockRow = {
        base_currency: "USD",
        target_currency: "BDT",
        rate: "110.5",
        fetched_at: new Date(),
      };

      mockQuery.mockResolvedValue({
        rows: [mockRow],
        rowCount: 1,
      });

      const result = await currencyService.convertCurrency({
        amount: 1000,
        fromCurrency: "USD",
        toCurrency: "BDT",
      });

      expect(result).toBeDefined();
      expect(result).toEqual({
        convertedAmount: 110500,
        rate: 110.5,
      });
    });

    it("should return same amount and rate 1 when fromCurrency equals toCurrency", async () => {
      const result = await currencyService.convertCurrency({
        amount: 1000,
        fromCurrency: "USD",
        toCurrency: "USD",
      });

      expect(result).toEqual({ convertedAmount: 1000, rate: 1 });
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("should throw error when exchange rate is not found", async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await expect(
        currencyService.convertCurrency({
          amount: 1000,
          fromCurrency: "INVALID",
          toCurrency: "BDT",
        }),
      ).rejects.toThrow("Exchange rate not found");
    });
  });

  describe("fetchAndCacheRates", () => {
    it("should fetch rates from API and update database", async () => {
      const mockApiResponse = {
        success: true,
        base: "USD",
        rates: {
          BDT: 110.5,
          EUR: 0.92,
        },
      };

      // Mock global fetch
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockApiResponse),
      } as any);

      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await currencyService.fetchAndCacheRates();

      expect(result).toBe(2); // 2 currencies updated
      expect(global.fetch).toHaveBeenCalled();
      expect(mockQuery).toHaveBeenCalled();
    });

    it("should throw error when API returns failure response", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue({ success: false, rates: null }),
      } as any);

      await expect(currencyService.fetchAndCacheRates()).rejects.toThrow(
        "Failed to fetch exchange rates from API",
      );
    });

    it("should throw error when fetch itself fails", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      await expect(currencyService.fetchAndCacheRates()).rejects.toThrow(
        "Network error",
      );
    });
  });

  describe("listRates", () => {
    it("should return all rates when no filter applied", async () => {
      const mockRows = [
        {
          base_currency: "USD",
          target_currency: "BDT",
          rate: "110.5",
          fetched_at: new Date(),
        },
        {
          base_currency: "USD",
          target_currency: "EUR",
          rate: "0.92",
          fetched_at: new Date(),
        },
      ];

      mockQuery.mockResolvedValue({ rows: mockRows, rowCount: 2 });

      const result = await currencyService.listRates({});

      expect(result).toHaveLength(2);
      expect(result[0].rate).toBe(110.5);
      expect(result[1].rate).toBe(0.92);
    });

    it("should filter rates by baseCurrency", async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            base_currency: "USD",
            target_currency: "BDT",
            rate: "110.5",
            fetched_at: new Date(),
          },
        ],
        rowCount: 1,
      });

      const result = await currencyService.listRates({ baseCurrency: "USD" });

      expect(result).toHaveLength(1);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("base_currency"),
        expect.arrayContaining(["USD"]),
      );
    });
  });

  describe("upsertRate", () => {
    it("should insert or update a currency rate and return it", async () => {
      const mockRow = {
        base_currency: "USD",
        target_currency: "BDT",
        rate: "110.5",
        fetched_at: new Date(),
      };

      mockQuery.mockResolvedValue({ rows: [mockRow], rowCount: 1 });

      const result = await currencyService.upsertRate({
        baseCurrency: "USD",
        targetCurrency: "BDT",
        rate: 110.5,
      });

      expect(result).toEqual({
        baseCurrency: "USD",
        targetCurrency: "BDT",
        rate: 110.5,
        fetchedAt: mockRow.fetched_at,
      });
    });
  });

  describe("getSupportedCurrencies", () => {
    it("should return list of supported currencies", async () => {
      const mockCurrencies = [
        { code: "USD", name: "US Dollar", symbol: "$" },
        { code: "BDT", name: "Bangladeshi Taka", symbol: "৳" },
      ];

      mockQuery.mockResolvedValue({
        rows: mockCurrencies,
        rowCount: mockCurrencies.length,
      });

      const result = await currencyService.getSupportedCurrencies();

      expect(result).toBeDefined();
      expect(result).toEqual(mockCurrencies);
    });
  });

  describe("getExchangeRateHistory", () => {
    it("should return exchange rate history for the specified number of days", async () => {
      const mockHistory = [
        {
          fromCurrency: "USD",
          toCurrency: "BDT",
          rate: 110.5,
          date: new Date(),
        },
        {
          fromCurrency: "USD",
          toCurrency: "BDT",
          rate: 110.8,
          date: new Date(Date.now() - 86400000),
        },
      ];

      mockQuery.mockResolvedValue({
        rows: mockHistory,
        rowCount: mockHistory.length,
      });

      const result = await currencyService.getExchangeRateHistory(
        "USD",
        "BDT",
        7,
      );

      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("currency_rate_history"),
        ["USD", "BDT", 7],
      );
    });
  });
});
