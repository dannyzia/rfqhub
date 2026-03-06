-- =====================================================================
-- Migration 018: Export Jobs & Currencies
-- Adds:
--   1. export_jobs table (required by export.service.ts)
--   2. currencies table (required by currency.service.ts getSupportedCurrencies)
--      with seed data for common ISO 4217 currencies
-- Uses gen_random_uuid() (pgcrypto) for Neon/AlwaysData compatibility
-- =====================================================================

-- 1. EXPORT JOBS
-- Tracks async export requests (PDF, Excel, CSV, ZIP)
CREATE TABLE IF NOT EXISTS export_jobs (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    export_type     TEXT        NOT NULL
                                CHECK (export_type IN ('tender', 'bids', 'vendor', 'report', 'audit', 'bulk')),
    format          TEXT        NOT NULL
                                CHECK (format IN ('pdf', 'xlsx', 'csv', 'zip')),
    tender_id       UUID        REFERENCES tenders(id) ON DELETE SET NULL,
    vendor_id       UUID        REFERENCES vendor_profiles(organization_id) ON DELETE SET NULL,
    status          TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    file_url        TEXT,
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_export_jobs_user_id
    ON export_jobs (user_id);

CREATE INDEX IF NOT EXISTS idx_export_jobs_status
    ON export_jobs (status);

CREATE INDEX IF NOT EXISTS idx_export_jobs_created_at
    ON export_jobs (created_at DESC);

-- 2. CURRENCIES
-- Master list of supported currencies with symbol, for getSupportedCurrencies()
-- The legacy currency_master table only has (code, name); this table adds symbol.
CREATE TABLE IF NOT EXISTS currencies (
    code    CHAR(3)  PRIMARY KEY,   -- ISO 4217
    name    TEXT     NOT NULL,
    symbol  TEXT     NOT NULL DEFAULT ''
);

-- Seed common currencies (INSERT … ON CONFLICT DO NOTHING is idempotent)
INSERT INTO currencies (code, name, symbol) VALUES
    ('AED', 'UAE Dirham',                    'د.إ'),
    ('AUD', 'Australian Dollar',             'A$'),
    ('BDT', 'Bangladeshi Taka',              '৳'),
    ('BHD', 'Bahraini Dinar',                'BD'),
    ('BRL', 'Brazilian Real',                'R$'),
    ('CAD', 'Canadian Dollar',               'C$'),
    ('CHF', 'Swiss Franc',                   'CHF'),
    ('CNY', 'Chinese Yuan',                  '¥'),
    ('CZK', 'Czech Koruna',                  'Kč'),
    ('DKK', 'Danish Krone',                  'kr'),
    ('EGP', 'Egyptian Pound',                'E£'),
    ('EUR', 'Euro',                          '€'),
    ('GBP', 'British Pound Sterling',        '£'),
    ('HKD', 'Hong Kong Dollar',              'HK$'),
    ('HUF', 'Hungarian Forint',              'Ft'),
    ('IDR', 'Indonesian Rupiah',             'Rp'),
    ('ILS', 'Israeli New Shekel',            '₪'),
    ('INR', 'Indian Rupee',                  '₹'),
    ('JPY', 'Japanese Yen',                  '¥'),
    ('KRW', 'South Korean Won',              '₩'),
    ('KWD', 'Kuwaiti Dinar',                 'KD'),
    ('MYR', 'Malaysian Ringgit',             'RM'),
    ('NOK', 'Norwegian Krone',               'kr'),
    ('NPR', 'Nepalese Rupee',                'रू'),
    ('NZD', 'New Zealand Dollar',            'NZ$'),
    ('OMR', 'Omani Rial',                    'ر.ع.'),
    ('PHP', 'Philippine Peso',               '₱'),
    ('PKR', 'Pakistani Rupee',               '₨'),
    ('PLN', 'Polish Zloty',                  'zł'),
    ('QAR', 'Qatari Riyal',                  'QR'),
    ('SAR', 'Saudi Riyal',                   'SR'),
    ('SEK', 'Swedish Krona',                 'kr'),
    ('SGD', 'Singapore Dollar',              'S$'),
    ('THB', 'Thai Baht',                     '฿'),
    ('TRY', 'Turkish Lira',                  '₺'),
    ('TWD', 'New Taiwan Dollar',             'NT$'),
    ('USD', 'United States Dollar',          '$'),
    ('VND', 'Vietnamese Dong',               '₫'),
    ('ZAR', 'South African Rand',            'R')
ON CONFLICT (code) DO UPDATE
    SET name   = EXCLUDED.name,
        symbol = EXCLUDED.symbol;
