import type { Metadata } from 'next';
import Link from 'next/link';
import { BarChart3 } from 'lucide-react';

export const metadata: Metadata = {
  title: {
    template: '%s | PerformX',
    default: 'PerformX',
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="bg-indigo-600 rounded-xl p-2">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <Link href="/" className="text-2xl font-bold text-white">
            Perform<span className="text-indigo-400">X</span>
          </Link>
        </div>

        {/* Content */}
        {children}

        {/* Footer */}
        <p className="text-center text-slate-400 text-sm mt-8">
          &copy; {new Date().getFullYear()} PerformX. All rights reserved.
        </p>
      </div>
    </div>
  );
}
