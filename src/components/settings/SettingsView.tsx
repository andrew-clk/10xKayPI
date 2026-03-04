'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Employee, Company } from '@/types';

interface Props {
  user: Employee;
  company: Company;
}

export function SettingsView({ user, company }: Props) {
  const [profile, setProfile] = useState({ fullName: user.fullName, phone: user.phone ?? '' });
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function saveProfile() {
    setSavingProfile(true);
    try {
      const res = await fetch(`/api/employees/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: profile.fullName, phone: profile.phone || null }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed to save'); return; }
      toast.success('Profile updated');
    } catch {
      toast.error('Network error');
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword() {
    if (passwords.newPass !== passwords.confirm) { toast.error('Passwords do not match'); return; }
    if (passwords.newPass.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setSavingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPass }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed to change password'); return; }
      toast.success('Password changed successfully');
      setPasswords({ current: '', newPass: '', confirm: '' });
    } catch {
      toast.error('Network error');
    } finally {
      setSavingPassword(false);
    }
  }

  const TIER_COLORS: Record<string, string> = {
    free: 'bg-slate-100 text-slate-600',
    starter: 'bg-blue-100 text-blue-800',
    professional: 'bg-indigo-100 text-indigo-800',
    enterprise: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={profile.fullName} onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+601234567890" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user.email} disabled className="bg-slate-50 text-slate-500" />
            </div>
            <div className="space-y-1.5">
              <Label>Employee ID</Label>
              <Input value={user.employeeId} disabled className="bg-slate-50 text-slate-500 font-mono" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Position</Label>
              <Input value={user.position} disabled className="bg-slate-50 text-slate-500" />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Input value={user.role.replace('_', ' ')} disabled className="bg-slate-50 text-slate-500 capitalize" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveProfile} disabled={savingProfile} className="bg-indigo-600 hover:bg-indigo-700">
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Current Password</Label>
            <Input type="password" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input type="password" value={passwords.newPass} onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm Password</Label>
              <Input type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={savePassword} disabled={savingPassword} variant="outline">
              {savingPassword ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Company Info (read-only for non-admins) */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Company</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Company Name</span>
            <span className="font-medium text-slate-900">{company.name}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Subscription</span>
            <Badge className={`text-xs capitalize ${TIER_COLORS[company.subscriptionTier] ?? ''}`}>
              {company.subscriptionTier} · {company.subscriptionStatus}
            </Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Timezone</span>
            <span className="text-sm text-slate-900">{company.timezone}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Review Period Start Day</span>
            <span className="text-sm text-slate-900">Day {company.reviewPeriodStartDay}</span>
          </div>
          {company.trialEndsAt && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Trial Ends</span>
                <span className="text-sm text-slate-900">{new Date(company.trialEndsAt).toLocaleDateString()}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
