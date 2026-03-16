import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from '../src/db';

async function addLeaderRole() {
  try {
    console.log('🔄 Adding leader role to employee_role enum...');

    // Add the new value to the enum
    await db.execute(sql`
      ALTER TYPE employee_role ADD VALUE IF NOT EXISTS 'leader' AFTER 'manager'
    `);

    console.log('✅ Successfully added leader role to employee_role enum');
    console.log('📝 You can now use the leader role for employees');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    // Check if the value already exists (expected in this case)
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log('ℹ️ Leader role already exists in the enum');
    }
  } finally {
    process.exit(0);
  }
}

addLeaderRole();