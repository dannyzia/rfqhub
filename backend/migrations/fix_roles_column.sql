-- =====================================================================
-- MIGRATION: Fix roles column in users table
-- Date: February 10, 2026
-- Issue: Database may have 'role' (singular) instead of 'roles' (plural)
-- =====================================================================

-- Check if 'role' column exists and rename it to 'roles'
DO $$
BEGIN
    -- Check if 'role' column exists (singular)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'role'
    ) THEN
        -- Rename 'role' to 'roles' if it exists
        ALTER TABLE users RENAME COLUMN role TO roles;
        
        -- Update the column type to TEXT[] array
        ALTER TABLE users ALTER COLUMN roles TYPE TEXT[] USING ARRAY[roles::TEXT];
        
        RAISE NOTICE 'Renamed column ''role'' to ''roles'' and updated type to TEXT[]';
    END IF;
    
    -- If 'roles' column doesn't exist, create it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'roles'
    ) THEN
        -- Add 'roles' column if it doesn't exist
        ALTER TABLE users ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT ARRAY['vendor'];
        
        RAISE NOTICE 'Added ''roles'' column to users table';
    END IF;
END $$;

-- Verify the fix
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('role', 'roles')
ORDER BY column_name;
