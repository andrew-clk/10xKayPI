import Link from 'next/link';
import { BarChart3, CheckCircle, Users, Target, ClipboardList, TrendingUp, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 rounded-lg p-1.5">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">Perform<span className="text-indigo-400">X</span></span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login"><Button variant="ghost" className="text-slate-300 hover:text-white">Sign In</Button></Link>
          <Link href="/register"><Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Start Free Trial</Button></Link>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <Badge className="bg-indigo-600/20 text-indigo-300 border-indigo-500/30 mb-6">14-day free trial • No credit card required</Badge>
        <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">KPI Performance Reviews<br /><span className="text-indigo-400">Made Simple</span></h1>
        <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">Multi-tenant SaaS platform for employee performance reviews using the flexible 4C KPI framework.</p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register"><Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8">Get Started Free</Button></Link>
          <Link href="/login"><Button size="lg" variant="outline" className="border-slate-500 text-slate-200 hover:bg-slate-800">Sign In</Button></Link>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Everything you need for performance management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Target, title: '4C KPI Framework', desc: 'Commitment, Contribution, Character, Competency — flexible weights totaling 100%.' },
            { icon: ClipboardList, title: 'Bi-Directional Reviews', desc: 'Employees self-rate and supervisors provide official ratings with side-by-side comparison.' },
            { icon: TrendingUp, title: 'Real-Time Analytics', desc: 'Grade distribution, performance trends, department comparison charts.' },
            { icon: Users, title: 'Multi-Tenant', desc: 'Complete data isolation between companies.' },
            { icon: Shield, title: 'Secure & Compliant', desc: 'Company-isolated data with server-side auth. GDPR-ready data management.' },
            { icon: Zap, title: 'Auto-Generation', desc: 'Monthly reviews auto-generated on the 1st with automated email reminders.' },
          ].map((f) => (
            <Card key={f.title} className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="bg-indigo-600/20 rounded-lg w-10 h-10 flex items-center justify-center mb-2">
                  <f.icon className="h-5 w-5 text-indigo-400" />
                </div>
                <CardTitle className="text-white text-lg">{f.title}</CardTitle>
              </CardHeader>
              <CardContent><p className="text-slate-400 text-sm">{f.desc}</p></CardContent>
            </Card>
          ))}
        </div>
      </div>
      <footer className="border-t border-slate-700 py-8 mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-400" />
            <span className="text-slate-400 text-sm">Perform<span className="text-indigo-400">X</span></span>
          </div>
          <p className="text-slate-500 text-sm">&copy; {new Date().getFullYear()} PerformX. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
