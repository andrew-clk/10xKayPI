'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  LayoutDashboard,
  ClipboardList,
  Users,
  UserCircle,
  Building2,
  Target,
  BarChart,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  CalendarDays,
  UsersRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import type { EmployeeRole } from '@/types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: EmployeeRole[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'manager', 'leader', 'employee'] },
  { href: '/dashboard/reviews', label: 'My Reviews', icon: ClipboardList, roles: ['super_admin', 'manager', 'leader', 'employee'] },
  { href: '/dashboard/my-team', label: 'My Team', icon: UsersRound, roles: ['super_admin', 'manager', 'leader'] },
  { href: '/dashboard/team-reviews', label: 'Team Reviews', icon: Users, roles: ['super_admin', 'manager', 'leader'] },
  { href: '/dashboard/employees', label: 'Employees', icon: UserCircle, roles: ['super_admin', 'manager', 'leader'] },
  { href: '/dashboard/departments', label: 'Departments', icon: Building2, roles: ['super_admin', 'manager'] },
  { href: '/dashboard/kpi-templates', label: 'KPI Templates', icon: Target, roles: ['super_admin', 'manager'] },
  { href: '/dashboard/review-periods', label: 'Review Periods', icon: CalendarDays, roles: ['super_admin'] },
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart, roles: ['super_admin', 'manager', 'leader'] },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell, roles: ['super_admin', 'manager', 'leader', 'employee'] },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, roles: ['super_admin', 'manager'] },
];

interface SidebarProps {
  userRole: EmployeeRole;
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ userRole, collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

  const filteredNav = navItems.filter(item => item.roles.includes(userRole));

  async function handleSignOut() {
    setSigningOut(true);
    await signOut({ callbackUrl: '/login' });
  }

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-slate-900 text-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-slate-700', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="bg-indigo-600 rounded-lg p-1.5 flex-shrink-0">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold">
            Perform<span className="text-indigo-400">X</span>
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors gap-3',
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                collapsed && 'justify-center px-2'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-2 pb-4 border-t border-slate-700 pt-4">
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          title={collapsed ? 'Sign Out' : undefined}
          className={cn(
            'flex items-center w-full rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors gap-3',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>{signingOut ? 'Signing out...' : 'Sign Out'}</span>}
        </button>
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute bottom-20 -right-3 bg-slate-700 rounded-full p-1 border border-slate-600 hover:bg-slate-600 transition-colors z-10"
      >
        {collapsed ? <ChevronRight className="h-3 w-3 text-white" /> : <ChevronLeft className="h-3 w-3 text-white" />}
      </button>
    </div>
  );
}
