import 'dotenv/config';
import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function addKpiTemplateColumn() {
  try {
    console.log('Adding kpi_template_id column to employees table...');

    // Add the column
    await db.execute(sql`
      ALTER TABLE employees
      ADD COLUMN IF NOT EXISTS kpi_template_id uuid
    `);

    console.log('✅ Column added successfully');

    // Try to add foreign key constraint
    try {
      await db.execute(sql`
        ALTER TABLE employees
        ADD CONSTRAINT employees_kpi_template_id_fk
        FOREIGN KEY (kpi_template_id)
        REFERENCES kpi_templates(id)
        ON DELETE SET NULL
      `);
      console.log('✅ Foreign key constraint added');
    } catch (e: any) {
      if (e.code === '42710') { // duplicate_object error
        console.log('ℹ️ Foreign key constraint already exists');
      } else {
        throw e;
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

addKpiTemplateColumn();