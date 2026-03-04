import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { kpiTemplates, kpiCriteria } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { TemplateBuilder } from '@/components/kpi/TemplateBuilder';
import type { KpiTemplate } from '@/types';

interface Props { params: Promise<{ id: string }> }

export default async function EditTemplatePage({ params }: Props) {
  const user = await requireAuth();
  const { id } = await params;

  const [template] = await db
    .select()
    .from(kpiTemplates)
    .where(and(eq(kpiTemplates.id, id), eq(kpiTemplates.companyId, user.companyId)));

  if (!template) notFound();

  const criteria = await db
    .select()
    .from(kpiCriteria)
    .where(eq(kpiCriteria.templateId, id))
    .orderBy(asc(kpiCriteria.sortOrder));

  const fullTemplate = { ...template, criteria } as KpiTemplate;

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/kpi-templates" className="hover:text-slate-900">KPI Templates</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-slate-900 font-medium">{template.name}</span>
      </nav>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{template.name}</h1>
        <p className="text-slate-500 mt-1">{template.positionType}</p>
      </div>
      <TemplateBuilder template={fullTemplate} />
    </div>
  );
}
