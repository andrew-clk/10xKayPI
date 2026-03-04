import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { companies } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { SettingsView } from '@/components/settings/SettingsView';

export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const user = await requireAuth();

  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, user.companyId));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account and company settings.</p>
      </div>
      <SettingsView user={user} company={company} />
    </div>
  );
}
