import { z } from "zod";

export const currencyCodeSchema = z
  .string()
  .length(3)
  .regex(/^[A-Z]{3}$/, "Must be a valid ISO 4217 currency code");

export const currencyRateSchema = z.object({
  baseCurrency: currencyCodeSchema,
  targetCurrency: currencyCodeSchema,
  rate: z.number().positive(),
});

export const convertCurrencySchema = z.object({
  amount: z.number().min(0),
  fromCurrency: currencyCodeSchema,
  toCurrency: currencyCodeSchema,
});

export const currencyFilterSchema = z.object({
  baseCurrency: currencyCodeSchema.optional(),
  targetCurrency: currencyCodeSchema.optional(),
});

export type CurrencyCode = z.infer<typeof currencyCodeSchema>;
export type CurrencyRateInput = z.infer<typeof currencyRateSchema>;
export type ConvertCurrencyInput = z.infer<typeof convertCurrencySchema>;
export type CurrencyFilterInput = z.infer<typeof currencyFilterSchema>;
