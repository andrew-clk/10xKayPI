import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ResetPasswordPage() {
  return (
    <Card className="bg-white/95 backdrop-blur shadow-2xl border-0">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-slate-900">Reset Password</CardTitle>
        <CardDescription className="text-slate-500">
          Change your password from the Settings page after signing in.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Link href="/login" className="text-indigo-600 hover:underline text-sm">Back to Sign In</Link>
      </CardContent>
    </Card>
  );
}
