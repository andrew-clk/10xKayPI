import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Falls back to a placeholder during build — real URL is required at runtime
const sql = neon(process.env.DATABASE_URL ?? 'postgresql://build:build@localhost/build');
export const db = drizzle(sql, { schema });
export * from './schema';
