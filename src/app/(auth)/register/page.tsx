'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, CheckCircle, ChevronLeft, ChevronRight, Eye, EyeOff, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const step1Schema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  industry: z.string().min(1, 'Please select an industry'),
  timezone: z.string().min(1, 'Please select a timezone'),
});

const step2Schema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const fullSchema = step1Schema.merge(step2Schema);
type FormValues = z.infer<typeof fullSchema>;

const INDUSTRIES = ['Construction', 'Installation Services', 'Sales', 'Manufacturing', 'Retail', 'Technology', 'Healthcare', 'Finance', 'Education', 'Logistics', 'Hospitality', 'Real Estate', 'Other'];
const TIMEZONES = ['Asia/Kuala_Lumpur', 'Asia/Singapore', 'Asia/Bangkok', 'Asia/Jakarta', 'Asia/Hong_Kong', 'Asia/Tokyo', 'Asia/Seoul', 'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Australia/Sydney'];

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(fullSchema),
    defaultValues: {
      companyName: '', industry: '', timezone: 'Asia/Kuala_Lumpur',
      fullName: '', email: '', phone: '', password: '', confirmPassword: '',
    },
  });

  const values = form.watch();

  async function handleNext() {
    if (step === 1) {
      const valid = await form.trigger(['companyName', 'industry', 'timezone']);
      if (valid) setStep(2);
    } else if (step === 2) {
      const valid = await form.trigger(['fullName', 'email', 'phone', 'password', 'confirmPassword']);
      if (valid) setStep(3);
    }
  }

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Registration failed.');
        return;
      }
      setSuccess(true);
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Card className="bg-white/95 backdrop-blur shadow-2xl border-0">
        <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-4">
          <div className="bg-green-100 rounded-full p-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Account Created!</h2>
          <p className="text-slate-500">Your account has been set up. You can now sign in with <strong>{values.email}</strong> to start your 14-day free trial.</p>
          <Link href="/login" className="text-indigo-600 font-medium hover:underline text-sm">Sign In Now</Link>
        </CardContent>
      </Card>
    );
  }

  const steps = [
    { label: 'Company', icon: Building2 },
    { label: 'Account', icon: User },
    { label: 'Review', icon: CheckCircle },
  ];

  return (
    <Card className="bg-white/95 backdrop-blur shadow-2xl border-0">
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-2">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = i + 1 === step;
            const isDone = i + 1 < step;
            return (
              <div key={s.label} className="flex items-center gap-2 flex-1">
                <div className={`rounded-full p-1.5 flex items-center justify-center transition-colors ${isDone ? 'bg-indigo-600' : isActive ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                  <Icon className={`h-4 w-4 ${isDone ? 'text-white' : isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                </div>
                <span className={`text-xs font-medium ${isActive ? 'text-indigo-600' : isDone ? 'text-slate-700' : 'text-slate-400'}`}>{s.label}</span>
                {i < 2 && <div className={`flex-1 h-0.5 ${isDone ? 'bg-indigo-600' : 'bg-slate-200'}`} />}
              </div>
            );
          })}
        </div>
        <div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            {step === 1 ? 'Company Information' : step === 2 ? 'Create Your Account' : 'Review & Confirm'}
          </CardTitle>
          <CardDescription className="text-slate-500 mt-1">
            {step === 1 ? 'Tell us about your organization' : step === 2 ? 'Set up your admin credentials' : 'Confirm your details to get started'}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {step === 1 && (
              <>
                <FormField control={form.control} name="companyName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl><Input placeholder="Acme Corporation" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="industry" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger></FormControl>
                      <SelectContent>{INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="timezone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{TIMEZONES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </>
            )}

            {step === 2 && (
              <>
                <FormField control={form.control} name="fullName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input placeholder="John Smith" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Email</FormLabel>
                    <FormControl><Input type="email" placeholder="john@company.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone <span className="text-slate-400">(optional)</span></FormLabel>
                    <FormControl><Input type="tel" placeholder="+60123456789" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters" className="pr-10" {...field} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl><Input type="password" placeholder="Re-enter password" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 p-4 space-y-3">
                  <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Company</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-slate-500">Name</span><span className="font-medium">{values.companyName}</span>
                    <span className="text-slate-500">Industry</span><span className="font-medium">{values.industry}</span>
                    <span className="text-slate-500">Timezone</span><span className="font-medium">{values.timezone}</span>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 p-4 space-y-3">
                  <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Admin Account</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-slate-500">Name</span><span className="font-medium">{values.fullName}</span>
                    <span className="text-slate-500">Email</span><span className="font-medium">{values.email}</span>
                    {values.phone && <><span className="text-slate-500">Phone</span><span className="font-medium">{values.phone}</span></>}
                  </div>
                </div>
                <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-4 text-sm text-indigo-800">
                  <strong>14-day free trial</strong> — No credit card required. Cancel anytime.
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)} className="flex items-center gap-1">
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
              )}
              {step < 3 && (
                <Button type="button" onClick={handleNext} className="flex-1 bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1 justify-center">
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              )}
              {step === 3 && (
                <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account & Start Trial'}
                </Button>
              )}
            </div>

            <p className="text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
