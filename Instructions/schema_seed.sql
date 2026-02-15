-- =====================================================================
-- RFQ & TENDERING PLATFORM — SEED DATA v3.0
-- Master/Reference table initialization
-- Run after: rfq_tendering_platform_schema_v3.sql
-- =====================================================================

-- =====================================================================
-- 1. TENDER STATUS MASTER
-- =====================================================================
INSERT INTO tender_status_master (code) VALUES
    ('draft'),
    ('published'),
    ('clarification'),
    ('closed'),
    ('tech_eval'),
    ('comm_eval'),
    ('awarded'),
    ('cancelled'),
    ('suspended')
ON CONFLICT (code) DO NOTHING;

-- =====================================================================
-- 2. TENDER TYPE MASTER
-- =====================================================================
INSERT INTO tender_type_master (code) VALUES
    ('RFQ'),
    ('TENDER'),
    ('EOI'),           -- Expression of Interest
    ('RFP'),           -- Request for Proposal
    ('DPM'),           -- Direct Procurement Method
    ('LTM'),           -- Limited Tendering Method
    ('OTM'),           -- Open Tendering Method
    ('RFQF')           -- Request for Quotation (Framework)
ON CONFLICT (code) DO NOTHING;

-- =====================================================================
-- 3. FEATURE TYPE MASTER
-- =====================================================================
INSERT INTO feature_type_master (code) VALUES
    ('single_select'),
    ('multi_select'),
    ('text'),
    ('numeric'),
    ('boolean'),
    ('date'),
    ('file_upload'),
    ('range')
ON CONFLICT (code) DO NOTHING;

-- =====================================================================
-- 4. ENVELOPE TYPE MASTER
-- =====================================================================
INSERT INTO envelope_type_master (code) VALUES
    ('technical'),
    ('commercial')
ON CONFLICT (code) DO NOTHING;

-- =====================================================================
-- 5. UNIT OF MEASURE (UOM) MASTER
-- =====================================================================
INSERT INTO uom_master (code, description) VALUES
    -- Quantity Units
    ('EA', 'Each'),
    ('PC', 'Piece'),
    ('SET', 'Set'),
    ('PKT', 'Packet'),
    ('BOX', 'Box'),
    ('CTN', 'Carton'),
    ('PAL', 'Pallet'),
    ('LOT', 'Lot'),
    ('UNIT', 'Unit'),
    ('DOZ', 'Dozen'),
    ('GROSS', 'Gross (144 units)'),
    ('PR', 'Pair'),
    ('REAM', 'Ream'),

    -- Length Units
    ('M', 'Meter'),
    ('CM', 'Centimeter'),
    ('MM', 'Millimeter'),
    ('KM', 'Kilometer'),
    ('FT', 'Foot'),
    ('IN', 'Inch'),
    ('YD', 'Yard'),
    ('MI', 'Mile'),
    ('RFT', 'Running Foot'),
    ('RM', 'Running Meter'),

    -- Area Units
    ('SQM', 'Square Meter'),
    ('SQFT', 'Square Foot'),
    ('SQYD', 'Square Yard'),
    ('HA', 'Hectare'),
    ('ACRE', 'Acre'),
    ('SQCM', 'Square Centimeter'),

    -- Volume Units
    ('CUM', 'Cubic Meter'),
    ('CUFT', 'Cubic Foot'),
    ('L', 'Liter'),
    ('ML', 'Milliliter'),
    ('GAL', 'Gallon'),
    ('BBL', 'Barrel'),

    -- Weight Units
    ('KG', 'Kilogram'),
    ('G', 'Gram'),
    ('MG', 'Milligram'),
    ('MT', 'Metric Ton'),
    ('LB', 'Pound'),
    ('OZ', 'Ounce'),
    ('QTL', 'Quintal'),
    ('BAG', 'Bag'),

    -- Time Units
    ('HR', 'Hour'),
    ('DAY', 'Day'),
    ('WK', 'Week'),
    ('MON', 'Month'),
    ('YR', 'Year'),
    ('MIN', 'Minute'),

    -- Service/Work Units
    ('LS', 'Lump Sum'),
    ('JOB', 'Job'),
    ('MH', 'Man-Hour'),
    ('MD', 'Man-Day'),
    ('MM', 'Man-Month'),
    ('TRIP', 'Trip'),
    ('LOAD', 'Load'),

    -- Data Units
    ('GB', 'Gigabyte'),
    ('TB', 'Terabyte'),
    ('MB', 'Megabyte'),

    -- Electrical Units
    ('KWH', 'Kilowatt Hour'),
    ('KVA', 'Kilovolt Ampere'),
    ('AMP', 'Ampere')
ON CONFLICT (code) DO NOTHING;

-- =====================================================================
-- 6. CURRENCY MASTER (ISO 4217)
-- =====================================================================
INSERT INTO currency_master (code, name) VALUES
    -- Major Currencies
    ('BDT', 'Bangladeshi Taka'),
    ('USD', 'United States Dollar'),
    ('EUR', 'Euro'),
    ('GBP', 'British Pound Sterling'),
    ('JPY', 'Japanese Yen'),
    ('CNY', 'Chinese Yuan Renminbi'),
    ('INR', 'Indian Rupee'),
    ('AUD', 'Australian Dollar'),
    ('CAD', 'Canadian Dollar'),
    ('CHF', 'Swiss Franc'),

    -- Asian Currencies
    ('SGD', 'Singapore Dollar'),
    ('MYR', 'Malaysian Ringgit'),
    ('THB', 'Thai Baht'),
    ('IDR', 'Indonesian Rupiah'),
    ('PKR', 'Pakistani Rupee'),
    ('LKR', 'Sri Lankan Rupee'),
    ('NPR', 'Nepalese Rupee'),
    ('MMK', 'Myanmar Kyat'),
    ('VND', 'Vietnamese Dong'),
    ('PHP', 'Philippine Peso'),
    ('KRW', 'South Korean Won'),
    ('HKD', 'Hong Kong Dollar'),
    ('TWD', 'Taiwan Dollar'),

    -- Middle East Currencies
    ('AED', 'UAE Dirham'),
    ('SAR', 'Saudi Riyal'),
    ('QAR', 'Qatari Riyal'),
    ('KWD', 'Kuwaiti Dinar'),
    ('BHD', 'Bahraini Dinar'),
    ('OMR', 'Omani Rial'),

    -- Other Major Currencies
    ('NZD', 'New Zealand Dollar'),
    ('ZAR', 'South African Rand'),
    ('BRL', 'Brazilian Real'),
    ('MXN', 'Mexican Peso'),
    ('RUB', 'Russian Ruble'),
    ('TRY', 'Turkish Lira'),
    ('SEK', 'Swedish Krona'),
    ('NOK', 'Norwegian Krone'),
    ('DKK', 'Danish Krone')
ON CONFLICT (code) DO NOTHING;

-- =====================================================================
-- 7. CATEGORIES MASTER (Procurement Categories)
-- =====================================================================
INSERT INTO categories_master (id, name) VALUES
    -- IT & Electronics
    (uuid_generate_v4(), 'Computer Hardware'),
    (uuid_generate_v4(), 'Computer Software'),
    (uuid_generate_v4(), 'Networking Equipment'),
    (uuid_generate_v4(), 'Telecommunications'),
    (uuid_generate_v4(), 'Office Electronics'),
    (uuid_generate_v4(), 'Security Systems'),
    (uuid_generate_v4(), 'Audio Visual Equipment'),

    -- Office Supplies & Furniture
    (uuid_generate_v4(), 'Office Supplies'),
    (uuid_generate_v4(), 'Office Furniture'),
    (uuid_generate_v4(), 'Stationery'),
    (uuid_generate_v4(), 'Printing Services'),

    -- Construction & Infrastructure
    (uuid_generate_v4(), 'Civil Construction'),
    (uuid_generate_v4(), 'Building Materials'),
    (uuid_generate_v4(), 'Electrical Works'),
    (uuid_generate_v4(), 'Plumbing & Sanitary'),
    (uuid_generate_v4(), 'HVAC Systems'),
    (uuid_generate_v4(), 'Road Construction'),
    (uuid_generate_v4(), 'Bridge Construction'),

    -- Machinery & Equipment
    (uuid_generate_v4(), 'Industrial Machinery'),
    (uuid_generate_v4(), 'Agricultural Equipment'),
    (uuid_generate_v4(), 'Medical Equipment'),
    (uuid_generate_v4(), 'Laboratory Equipment'),
    (uuid_generate_v4(), 'Construction Equipment'),
    (uuid_generate_v4(), 'Generator & Power Equipment'),

    -- Vehicles & Transport
    (uuid_generate_v4(), 'Motor Vehicles'),
    (uuid_generate_v4(), 'Vehicle Spare Parts'),
    (uuid_generate_v4(), 'Fuel & Lubricants'),
    (uuid_generate_v4(), 'Transport Services'),

    -- Professional Services
    (uuid_generate_v4(), 'Consulting Services'),
    (uuid_generate_v4(), 'Legal Services'),
    (uuid_generate_v4(), 'Audit & Accounting'),
    (uuid_generate_v4(), 'Training Services'),
    (uuid_generate_v4(), 'Research Services'),

    -- IT Services
    (uuid_generate_v4(), 'Software Development'),
    (uuid_generate_v4(), 'IT Support Services'),
    (uuid_generate_v4(), 'Cloud Services'),
    (uuid_generate_v4(), 'Cybersecurity Services'),
    (uuid_generate_v4(), 'Data Center Services'),

    -- Maintenance Services
    (uuid_generate_v4(), 'Building Maintenance'),
    (uuid_generate_v4(), 'Equipment Maintenance'),
    (uuid_generate_v4(), 'Cleaning Services'),
    (uuid_generate_v4(), 'Security Services'),
    (uuid_generate_v4(), 'Landscaping Services'),

    -- Healthcare
    (uuid_generate_v4(), 'Pharmaceuticals'),
    (uuid_generate_v4(), 'Medical Supplies'),
    (uuid_generate_v4(), 'Surgical Instruments'),
    (uuid_generate_v4(), 'Hospital Furniture'),

    -- Food & Catering
    (uuid_generate_v4(), 'Food Supplies'),
    (uuid_generate_v4(), 'Catering Services'),
    (uuid_generate_v4(), 'Beverages'),

    -- Textiles & Uniforms
    (uuid_generate_v4(), 'Uniforms & Apparel'),
    (uuid_generate_v4(), 'Textiles & Fabrics'),
    (uuid_generate_v4(), 'Safety Gear & PPE'),

    -- Energy & Utilities
    (uuid_generate_v4(), 'Solar Energy Systems'),
    (uuid_generate_v4(), 'Electrical Supplies'),
    (uuid_generate_v4(), 'Water Treatment'),

    -- Miscellaneous
    (uuid_generate_v4(), 'Books & Publications'),
    (uuid_generate_v4(), 'Promotional Materials'),
    (uuid_generate_v4(), 'Event Management'),
    (uuid_generate_v4(), 'Insurance Services'),
    (uuid_generate_v4(), 'Courier & Logistics')
ON CONFLICT (name) DO NOTHING;

-- =====================================================================
-- 8. TAX RULES (Bangladesh Context)
-- =====================================================================
INSERT INTO tax_rules (id, name, rate_percent, applies_to, is_active) VALUES
    (uuid_generate_v4(), 'VAT Standard Rate', 15.00, 'all', TRUE),
    (uuid_generate_v4(), 'VAT Reduced Rate', 7.50, 'goods', TRUE),
    (uuid_generate_v4(), 'VAT Exempt', 0.00, 'all', TRUE),
    (uuid_generate_v4(), 'TDS - Goods', 4.00, 'goods', TRUE),
    (uuid_generate_v4(), 'TDS - Works', 5.00, 'works', TRUE),
    (uuid_generate_v4(), 'TDS - Services', 10.00, 'services', TRUE),
    (uuid_generate_v4(), 'AIT - Goods', 3.00, 'goods', TRUE),
    (uuid_generate_v4(), 'AIT - Services', 5.00, 'services', TRUE),
    (uuid_generate_v4(), 'Customs Duty 5%', 5.00, 'goods', TRUE),
    (uuid_generate_v4(), 'Customs Duty 10%', 10.00, 'goods', TRUE),
    (uuid_generate_v4(), 'Customs Duty 25%', 25.00, 'goods', TRUE),
    (uuid_generate_v4(), 'Supplementary Duty', 20.00, 'goods', FALSE)
ON CONFLICT DO NOTHING;

-- =====================================================================
-- 9. DEFAULT ORGANIZATION & ADMIN USER (for initial setup)
-- =====================================================================
-- Note: Change password hash in production!
-- Default password is 'admin123' - bcrypt hash with cost 12
INSERT INTO organizations (id, name, type) VALUES
    ('00000000-0000-0000-0000-000000000001', 'System Administrator', 'buyer')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, organization_id, name, email, password_hash, roles, is_active) VALUES
    ('00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000001',
     'System Admin',
     'admin@rfqbuddy.com',
     '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4DsLp8AwEjvvchiu', -- CHANGE IN PRODUCTION!
     ARRAY['admin', 'buyer'],
     TRUE)
ON CONFLICT (email) DO NOTHING;

-- =====================================================================
-- 10. SAMPLE CURRENCY EXCHANGE RATES (for testing)
-- =====================================================================
INSERT INTO currency_rates (base_currency, target_currency, rate, fetched_at) VALUES
    ('USD', 'BDT', 119.50, NOW()),
    ('EUR', 'BDT', 129.75, NOW()),
    ('GBP', 'BDT', 151.25, NOW()),
    ('INR', 'BDT', 1.43, NOW()),
    ('CNY', 'BDT', 16.45, NOW()),
    ('JPY', 'BDT', 0.79, NOW()),
    ('SGD', 'BDT', 88.90, NOW()),
    ('AED', 'BDT', 32.55, NOW()),
    ('SAR', 'BDT', 31.85, NOW()),
    ('MYR', 'BDT', 25.20, NOW())
ON CONFLICT (base_currency, target_currency) DO UPDATE SET
    rate = EXCLUDED.rate,
    fetched_at = EXCLUDED.fetched_at;

-- =====================================================================
-- END SEED DATA v3.0
-- =====================================================================

-- Verification queries (uncomment to run)
-- SELECT 'tender_status_master' as table_name, COUNT(*) as row_count FROM tender_status_master
-- UNION ALL SELECT 'tender_type_master', COUNT(*) FROM tender_type_master
-- UNION ALL SELECT 'feature_type_master', COUNT(*) FROM feature_type_master
-- UNION ALL SELECT 'envelope_type_master', COUNT(*) FROM envelope_type_master
-- UNION ALL SELECT 'uom_master', COUNT(*) FROM uom_master
-- UNION ALL SELECT 'currency_master', COUNT(*) FROM currency_master
-- UNION ALL SELECT 'categories_master', COUNT(*) FROM categories_master
-- UNION ALL SELECT 'tax_rules', COUNT(*) FROM tax_rules
-- UNION ALL SELECT 'organizations', COUNT(*) FROM organizations
-- UNION ALL SELECT 'users', COUNT(*) FROM users
-- UNION ALL SELECT 'currency_rates', COUNT(*) FROM currency_rates;
