'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Server, Database, ShieldCheck, Clock, ExternalLink } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [showCronModal, setShowCronModal] = useState(false);

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Activity },
    { href: '/render', label: 'Render Backend', icon: Server },
    { href: '/supabase', label: 'Supabase Project', icon: Database },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Activity className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <Link href="/" className="font-bold text-lg text-slate-100 flex items-center gap-2">
                KeepAlive <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">24/7 CLOUD</span>
              </Link>
            </div>
          </div>

          <nav className="flex items-center space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700/60 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}

            <button
              onClick={() => setShowCronModal(true)}
              className="ml-2 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-slate-100 hover:border-slate-600 transition"
              title="View 24/7 Vercel Cron Setup"
            >
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden md:inline">24/7 Setup</span>
            </button>
          </nav>
        </div>
      </header>

      {/* 24/7 Cron Setup Instructions Modal */}
      {showCronModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-cyan-400" />
                <h3 className="font-semibold text-slate-100 text-lg">24/7 Cloud Monitoring Setup</h3>
              </div>
              <button
                onClick={() => setShowCronModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xl font-mono leading-none"
              >
                &times;
              </button>
            </div>

            <p className="text-sm text-slate-300">
              Your serverless endpoint operates on Vercel even when your laptop and browser are completely turned off.
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-medium text-slate-400">Target Webhook Endpoint:</div>
                <div className="font-mono text-cyan-400 select-all break-all">
                  https://your-app.vercel.app/api/cron
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-medium text-slate-400">Security Header (Optional):</div>
                <div className="font-mono text-slate-300 select-all">
                  Authorization: Bearer &lt;CRON_SECRET&gt;
                </div>
              </div>

              <div className="pt-2 text-slate-300 space-y-2">
                <div className="font-medium text-slate-200">Recommended Free 10-Minute Schedulers:</div>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li>
                    <strong className="text-slate-300">cron-job.org</strong> (100% Free, 1-min to 10-min schedule, supports custom headers)
                  </li>
                  <li>
                    <strong className="text-slate-300">GitHub Actions</strong> (Free scheduled workflow pinging <code className="text-cyan-400 font-mono">/api/cron</code>)
                  </li>
                  <li>
                    <strong className="text-slate-300">Vercel Cron</strong> (Configured in <code className="text-cyan-400 font-mono">vercel.json</code>)
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                onClick={() => setShowCronModal(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
