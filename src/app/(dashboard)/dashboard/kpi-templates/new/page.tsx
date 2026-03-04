import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { TemplateBuilder } from '@/components/kpi/TemplateBuilder';

export const metadata = { title: 'New KPI Template' };

export default function NewTemplatePage() {
  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/kpi-templates" className="hover:text-slate-900">KPI Templates</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-slate-900 font-medium">New Template</span>
      </nav>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create KPI Template</h1>
        <p className="text-slate-500 mt-1">Define the 4C framework criteria for a position type.</p>
      </div>
      <TemplateBuilder />
    </div>
  );
}
