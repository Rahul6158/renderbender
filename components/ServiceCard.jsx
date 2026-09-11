'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Server, Database, Play, ExternalLink, Zap, Clock, ArrowRight } from 'lucide-react';
import StatusBadge from './StatusBadge';

function formatRelativeTime(isoString) {
  if (!isoString) return 'Never';
  const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return new Date(isoString).toLocaleDateString();
}

export default function ServiceCard({ service, onTest, testLoading }) {
  const isRender = service.id === 'render';
  const Icon = isRender ? Server : Database;
  const brandColor = isRender ? 'text-emerald-400' : 'text-teal-400';
  const borderColor = isRender ? 'hover:border-emerald-500/50' : 'hover:border-teal-500/50';

  const href = isRender ? '/render' : '/supabase';

  return (
    <div className={`rounded-2xl bg-slate-900/90 border border-slate-800 p-6 flex flex-col justify-between transition-all duration-200 shadow-xl ${borderColor}`}>
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${isRender ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                {isRender ? 'Keep-Alive Target' : 'Database Connectivity'}
              </div>
              <h2 className="text-xl font-bold text-slate-100">{service.name}</h2>
            </div>
          </div>

          <StatusBadge status={service.last_status} is_active={service.is_active} />
        </div>

        {/* URL Target */}
        <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs font-mono text-slate-300 truncate">
          {service.url ? (
            <span className="flex items-center gap-1.5 truncate">
              <span className="text-slate-500">{isRender ? (service.method || 'GET') : 'REST'}</span>
              <span className="truncate text-slate-200">
                {(() => {
                  let base = service.url.trim();
                  if (!isRender) return base;
                  if (!base.startsWith('http://') && !base.startsWith('https://')) base = `https://${base}`;
                  try {
                    const u = new URL(base);
                    const ep = service.endpoint ? service.endpoint.trim() : '';
                    if (u.pathname && u.pathname !== '/' && u.pathname !== '') {
                      if (!ep || ep === '/' || ep === u.pathname) return u.origin + u.pathname;
                      return `${u.origin}${u.pathname.replace(/\/+$/, '')}${ep.startsWith('/') ? ep : '/' + ep}`;
                    }
                    return `${u.origin}${ep ? (ep.startsWith('/') ? ep : '/' + ep) : ''}`;
                  } catch {
                    return `${base}${service.endpoint || ''}`;
                  }
                })()}
              </span>
            </span>
          ) : (
            <span className="text-slate-500 italic">No URL configured yet</span>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/60">
            <div className="text-xs text-slate-500 font-medium">Response Latency</div>
            <div className="mt-1 text-lg font-bold font-mono text-slate-100 flex items-center gap-1">
              <Zap className="h-4 w-4 text-cyan-400" />
              {service.last_latency_ms !== null && service.last_latency_ms !== undefined ? (
                <span>{service.last_latency_ms} <span className="text-xs font-normal text-slate-400">ms</span></span>
              ) : (
                <span className="text-slate-600">--</span>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/60">
            <div className="text-xs text-slate-500 font-medium">Last Checked</div>
            <div className="mt-1 text-sm font-semibold font-mono text-slate-200 flex items-center gap-1">
              <Clock className="h-4 w-4 text-slate-400" />
              <span>{formatRelativeTime(service.last_checked_at)}</span>
            </div>
          </div>
        </div>

        {/* Details Row */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 px-1">
          <div>
            Interval: <strong className="text-slate-200">{service.interval_minutes || 10}m</strong>
          </div>
          {service.last_status_code && (
            <div className="font-mono">
              Status Code: <strong className={service.last_status_code >= 400 ? 'text-rose-400' : 'text-emerald-400'}>{service.last_status_code}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
        <button
          onClick={() => onTest(service.id)}
          disabled={testLoading || !service.url}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <Play className={`h-3.5 w-3.5 ${testLoading ? 'animate-spin' : 'text-emerald-400'}`} />
          <span>{testLoading ? 'Testing...' : 'Test Now'}</span>
        </button>

        <Link
          href={href}
          className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 transition"
        >
          <span>Configure</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
