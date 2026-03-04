'use client';

import Link from 'next/link';
import { Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ForgotPasswordPage() {
  return (
    <Card className="bg-white/95 backdrop-blur shadow-2xl border-0">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-2">
          <div className="bg-indigo-100 rounded-full p-3">
            <Mail className="h-6 w-6 text-indigo-600" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-slate-900 text-center">Forgot password?</CardTitle>
        <CardDescription className="text-slate-500 text-center">
          Contact your administrator to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center text-sm text-slate-500 space-y-3">
        <p>For this MVP, password resets are handled by your system administrator via the Settings page.</p>
        <Link href="/login" className="text-indigo-600 hover:underline block">Back to Sign In</Link>
      </CardContent>
    </Card>
  );
}
