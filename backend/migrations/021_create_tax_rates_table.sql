-- =====================================================================
-- Migration 021: Create tax_rates Table
-- Stores tax rates by jurisdiction with proper persistence and validation
-- Uses gen_random_uuid() (pgcrypto) for compatibility with Neon PostgreSQL
-- =====================================================================

CREATE TABLE IF NOT EXISTS tax_rates (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code    VARCHAR(2)  NOT NULL,
    state_code      VARCHAR(10),
    tax_type        VARCHAR(50) NOT NULL,
    rate            NUMERIC(5,2) NOT NULL CHECK (rate >= 0 AND rate <= 100),
    effective_date   DATE        NOT NULL,
    expiry_date     DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID        REFERENCES users(id) ON DELETE SET NULL,
    
    -- Ensure no overlapping tax rates for same jurisdiction and type
    CONSTRAINT tax_rates_unique_jurisdiction UNIQUE (country_code, state_code, tax_type, effective_date),
    
    -- Ensure expiry_date is after effective_date if both are set
    CONSTRAINT tax_rates_valid_date_range CHECK (
        expiry_date IS NULL OR expiry_date >= effective_date
    )
);

-- Index for fast lookups by country and state
CREATE INDEX IF NOT EXISTS idx_tax_rates_jurisdiction 
    ON tax_rates (country_code, state_code);

-- Index for filtering by tax type
CREATE INDEX IF NOT EXISTS idx_tax_rates_tax_type 
    ON tax_rates (tax_type);

-- Index for filtering by effective date
CREATE INDEX IF NOT EXISTS idx_tax_rates_effective_date 
    ON tax_rates (effective_date);

-- Index for filtering by expiry date
CREATE INDEX IF NOT EXISTS idx_tax_rates_expiry_date 
    ON tax_rates (expiry_date);

-- Index for active rates (not expired)
-- Note: Cannot use now() in partial index predicate (not IMMUTABLE)
CREATE INDEX IF NOT EXISTS idx_tax_rates_active 
    ON tax_rates (country_code, state_code, tax_type, expiry_date);

-- Add comment to table
COMMENT ON TABLE tax_rates IS 'Stores tax rates by jurisdiction with effective date tracking for financial calculations';

-- Add comments to columns
COMMENT ON COLUMN tax_rates.country_code IS 'ISO 3166-1 alpha-2 country code (e.g., US, GB, DE)';
COMMENT ON COLUMN tax_rates.state_code IS 'State or province code (e.g., CA, NY, null for national rates)';
COMMENT ON COLUMN tax_rates.tax_type IS 'Type of tax (e.g., VAT, GST, Sales Tax)';
COMMENT ON COLUMN tax_rates.rate IS 'Tax rate as percentage (0-100)';
COMMENT ON COLUMN tax_rates.effective_date IS 'Date when this tax rate becomes effective';
COMMENT ON COLUMN tax_rates.expiry_date IS 'Date when this tax rate expires (null means no expiry)';
COMMENT ON COLUMN tax_rates.created_by IS 'User ID who created this tax rate';
