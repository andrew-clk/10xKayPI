'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import type { Notification } from '@/types';

const TYPE_COLORS: Record<string, string> = {
  review_opened: 'bg-blue-100 text-blue-800',
  review_due_soon: 'bg-yellow-100 text-yellow-800',
  review_overdue: 'bg-red-100 text-red-800',
  review_submitted: 'bg-green-100 text-green-800',
  review_acknowledged: 'bg-indigo-100 text-indigo-800',
  system: 'bg-slate-100 text-slate-600',
};

const TYPE_LABELS: Record<string, string> = {
  review_opened: 'Review Opened',
  review_due_soon: 'Due Soon',
  review_overdue: 'Overdue',
  review_submitted: 'Submitted',
  review_acknowledged: 'Acknowledged',
  system: 'System',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(data => { setNotifications(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  async function markAllRead() {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n => fetch(`/api/notifications/${n.id}`, { method: 'PATCH' })));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 mt-1">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1">
            <CheckCheck className="h-4 w-4" />Mark All Read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Bell className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`border rounded-lg p-4 transition-colors ${n.read ? 'bg-white' : 'bg-indigo-50/50 border-indigo-200'}`}
              onClick={() => !n.read && markRead(n.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-xs ${TYPE_COLORS[n.type] ?? 'bg-slate-100'}`}>
                      {TYPE_LABELS[n.type] ?? n.type}
                    </Badge>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />}
                  </div>
                  <p className="font-medium text-sm text-slate-900 mt-1.5">{n.title}</p>
                  <p className="text-sm text-slate-600 mt-0.5">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1.5">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {n.actionUrl && (
                  <Button asChild variant="outline" size="sm" className="shrink-0 text-xs" onClick={e => e.stopPropagation()}>
                    <Link href={n.actionUrl}>View</Link>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
