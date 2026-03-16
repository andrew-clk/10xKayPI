-- Add kpiTemplateId column to employees table
ALTER TABLE "employees"
ADD COLUMN IF NOT EXISTS "kpi_template_id" uuid;

-- Add foreign key constraint
ALTER TABLE "employees"
ADD CONSTRAINT "employees_kpi_template_id_kpi_templates_id_fk"
FOREIGN KEY ("kpi_template_id")
REFERENCES "kpi_templates"("id")
ON DELETE SET NULL
ON UPDATE NO ACTION;