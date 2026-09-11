'use client';

import { useState, useEffect } from 'react';
import ServiceCard from '@/components/ServiceCard';
import StatusBadge from '@/components/StatusBadge';
import { Activity, RefreshCw, Play, ShieldAlert, CheckCircle2, Zap, Server, Database, Code } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState({
    render: null,
    supabase: null,
    recentChecks: { render: [], supabase: [] },
  });
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState(null);
  const [cronRunning, setCronRunning] = useState(false);
  const [message, setMessage] = useState(null);

  async function fetchStatus() {
    try {
      setLoading(true);
      const res = await fetch('/api/status');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
    // Auto-refresh dashboard every 20 seconds
    const interval = setInterval(fetchStatus, 20000);
    return () => clearInterval(interval);
  }, []);

  async function handleTestService(id) {
    try {
      setTestingId(id);
      setMessage(null);
      const res = await fetch(`/api/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
      });
      const result = await res.json();
      if (result.success) {
        setMessage({
          type: 'success',
          text: `Check completed: ${result.check.status} (${result.check.latency_ms}ms)`,
        });
        await fetchStatus();
      } else {
        setMessage({ type: 'error', text: result.error || 'Test check failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setTestingId(null);
    }
  }

  async function handleRunCron() {
    try {
      setCronRunning(true);
      setMessage(null);
      const res = await fetch('/api/cron');
      const json = await res.json();
      if (json.success) {
        setMessage({
          type: 'success',
          text: `Cron run executed: ${json.executed_count} active services checked.`,
        });
        await fetchStatus();
      } else {
        setMessage({ type: 'error', text: json.error || 'Cron execution failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setCronRunning(false);
    }
  }

  const allChecks = [
    ...(data.recentChecks?.render || []),
    ...(data.recentChecks?.supabase || []),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner / Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Keep-Alive & Health Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            24/7 server-side monitoring for Render backends and Supabase database projects.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleRunCron}
            disabled={cronRunning}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
          >
            <Play className={`h-3.5 w-3.5 ${cronRunning ? 'animate-spin' : ''}`} />
            <span>{cronRunning ? 'Running Cron...' : 'Run Cron Cycle'}</span>
          </button>
        </div>
      </div>

      {/* Alert Notification Toast */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs opacity-70 hover:opacity-100 font-bold ml-2">
            &times;
          </button>
        </div>
      )}

      {/* Primary Service Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.render ? (
          <ServiceCard
            service={data.render}
            onTest={handleTestService}
            testLoading={testingId === 'render'}
          />
        ) : (
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-500">
            Loading Render service...
          </div>
        )}

        {data.supabase ? (
          <ServiceCard
            service={data.supabase}
            onTest={handleTestService}
            testLoading={testingId === 'supabase'}
          />
        ) : (
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-500">
            Loading Supabase service...
          </div>
        )}
      </div>

      {/* Latest Response Previews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Render Latest Response */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Server className="h-4 w-4 text-emerald-400" />
              <span>Render Response Preview</span>
            </div>
            {data.render?.last_status_code && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                HTTP {data.render.last_status_code}
              </span>
            )}
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono text-slate-300 max-h-36 overflow-y-auto whitespace-pre-wrap break-all">
            {data.recentChecks?.render?.[0]?.response_preview || (
              <span className="text-slate-600 italic">No response captured yet. Click "Test Now" or configure your Render URL.</span>
            )}
          </div>
        </div>

        {/* Supabase Latest Response */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Database className="h-4 w-4 text-teal-400" />
              <span>Supabase Response Preview</span>
            </div>
            {data.supabase?.last_status_code && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-400 border border-slate-700">
                HTTP {data.supabase.last_status_code}
              </span>
            )}
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono text-slate-300 max-h-36 overflow-y-auto whitespace-pre-wrap break-all">
            {data.recentChecks?.supabase?.[0]?.response_preview || (
              <span className="text-slate-600 italic">No response captured yet. Click "Test Now" or configure your Supabase Project URL.</span>
            )}
          </div>
        </div>
      </div>

      {/* Global Activity / Checks History Feed */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-100">Recent Health Checks Log</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">Last 10 executions</span>
        </div>

        {allChecks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-mono">
                  <th className="pb-3 font-medium">Service</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Latency</th>
                  <th className="pb-3 font-medium">HTTP Code</th>
                  <th className="pb-3 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {allChecks.map((check) => {
                  const isRender = check.service_id === 'render';
                  return (
                    <tr key={check.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 font-sans font-medium text-slate-200 flex items-center gap-2">
                        {isRender ? (
                          <Server className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Database className="h-3.5 w-3.5 text-teal-400" />
                        )}
                        <span>{isRender ? 'Render Backend' : 'Supabase'}</span>
                      </td>
                      <td className="py-3 font-sans">
                        <StatusBadge status={check.status} is_active={true} />
                      </td>
                      <td className="py-3 text-slate-300">
                        <span className="text-cyan-400 font-bold">{check.latency_ms}</span> ms
                      </td>
                      <td className="py-3">
                        {check.status_code ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] ${
                              check.status_code >= 400
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {check.status_code}
                          </span>
                        ) : (
                          <span className="text-slate-600">--</span>
                        )}
                      </td>
                      <td className="py-3 text-slate-400">
                        {new Date(check.created_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center text-slate-500 text-sm italic">
            No health checks recorded yet. Configure your services and trigger a check!
          </div>
        )}
      </div>
    </div>
  );
}
