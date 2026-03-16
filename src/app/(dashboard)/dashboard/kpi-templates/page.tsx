import { requireRole } from '@/lib/auth';
import { db } from '@/db';
import { kpiTemplates, kpiCriteria } from '@/db/schema';
import { eq, inArray, asc } from 'drizzle-orm';
import { TemplateList } from '@/components/kpi/TemplateList';
import type { KpiTemplate } from '@/types';

export const metadata = { title: 'KPI Templates' };

export default async function KpiTemplatesPage() {
  // Only super_admin and manager can access templates
  const user = await requireRole(['super_admin', 'manager']);

  const templates = await db.select().from(kpiTemplates).where(eq(kpiTemplates.companyId, user.companyId));

  const allCriteria = templates.length > 0
    ? await db.select().from(kpiCriteria).where(inArray(kpiCriteria.templateId, templates.map(t => t.id))).orderBy(asc(kpiCriteria.sortOrder))
    : [];

  const criteriaMap = allCriteria.reduce<Record<string, typeof kpiCriteria.$inferSelect[]>>(
    (acc, c) => { (acc[c.templateId] ??= []).push(c); return acc; }, {}
  );

  const templatesWithCriteria = templates.map(t => ({
    ...t,
    criteria: criteriaMap[t.id] ?? [],
  })) as KpiTemplate[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">KPI Templates</h1>
        <p className="text-slate-500 mt-1">Manage your 4C KPI frameworks for different positions.</p>
      </div>
      <TemplateList templates={templatesWithCriteria} />
    </div>
  );
}
