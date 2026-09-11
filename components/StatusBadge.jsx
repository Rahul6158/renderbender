import React from 'react';

export default function StatusBadge({ status, is_active = true, className = '' }) {
  if (!is_active) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700 ${className}`}>
        <span className="h-2 w-2 rounded-full bg-slate-500" />
        Paused
      </span>
    );
  }

  const s = (status || '').toLowerCase();

  if (s.includes('healthy') || s.includes('connected')) {
    if (s.includes('slow') || s.includes('cold start')) {
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 ${className}`}>
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          {status}
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${className}`}>
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        {status}
      </span>
    );
  }

  if (s.includes('unreachable') || s.includes('unhealthy') || s.includes('auth failed') || s.includes('error')) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 ${className}`}>
        <span className="h-2 w-2 rounded-full bg-rose-400" />
        {status}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700 ${className}`}>
      <span className="h-2 w-2 rounded-full bg-slate-500" />
      {status || 'Not Configured'}
    </span>
  );
}
