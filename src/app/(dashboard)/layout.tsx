import { requireAuth } from '@/lib/auth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();

  const unreadNotifications = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)));

  return (
    <DashboardLayout user={user} unreadCount={unreadNotifications.length}>
      {children}
    </DashboardLayout>
  );
}
