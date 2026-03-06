import dotenv from 'dotenv';
import path from 'path';

// Load .env.test BEFORE any other module (including database.ts) is imported.
// This runs in Jest's setupFiles phase — earlier than setupFilesAfterEnv —
// so process.env is populated before pg.Pool is created in config/database.ts.
dotenv.config({ path: path.join(process.cwd(), '.env.test') });
