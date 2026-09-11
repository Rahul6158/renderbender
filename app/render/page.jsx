'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import { Server, Play, Save, Pause, CheckCircle2, ShieldAlert, ArrowLeft, Zap, Clock, Code, AlertTriangle } from 'lucide-react';

export default function RenderPage() {
  const [form, setForm] = useState({
    url: '',
    endpoint: '/health',
    method: 'GET',
    interval_minutes: 10,
    expected_status: 200,
    timeout_seconds: 30,
    is_active: true,
  });

  const [service, setService] = useState(null);
  const [recentChecks, setRecentChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      const res = await fetch('/api/render');
      if (res.ok) {
        const json = await res.json();
        if (json.service) {
          setService(json.service);
          setForm({
            url: json.service.url || '',
            endpoint: json.service.endpoint || '/health',
            method: json.service.method || 'GET',
            interval_minutes: json.service.interval_minutes || 10,
            expected_status: json.service.expected_status || 200,
            timeout_seconds: json.service.timeout_seconds || 30,
            is_active: json.service.is_active ?? true,
          });
        }
        if (json.recentChecks) {
          setRecentChecks(json.recentChecks);
        }
      }
    } catch (err) {
      console.error('Failed to load Render config:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSave(e) {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Render configuration saved successfully!' });
        await loadData();
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to save configuration' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    try {
      setTesting(true);
      setMessage(null);
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', ...form }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({
          type: 'success',
          text: `Check Completed: ${json.check.status} (${json.check.latency_ms}ms, HTTP ${json.check.status_code || '--'})`,
        });
        await loadData();
      } else {
        setMessage({ type: 'error', text: json.error || 'Test check failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setTesting(false);
    }
  }

  async function handleToggleActive() {
    try {
      setMessage(null);
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle' }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({
          type: 'success',
          text: `Render monitoring is now ${json.service.is_active ? 'ACTIVE' : 'PAUSED'}.`,
        });
        await loadData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 mb-2 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Server className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Render Keep-Alive & Health</h1>
              <p className="text-xs text-slate-400">Keep free-tier Render services warm and monitor health 24/7</p>
            </div>
          </div>
        </div>

        {service && (
          <div className="flex items-center gap-3">
            <StatusBadge status={service.last_status} is_active={service.is_active} />
            <button
              onClick={handleToggleActive}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                service.is_active
                  ? 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                  : 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500'
              }`}
            >
              {service.is_active ? (
                <>
                  <Pause className="h-3.5 w-3.5 text-amber-400" />
                  <span>Pause Monitor</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 text-white" />
                  <span>Resume Monitor</span>
                </>
              )}
            </button>
          </div>
        )}
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

      {/* Configuration Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-5 shadow-xl">
          <h2 className="text-lg font-bold text-slate-100">Service Configuration</h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Render Backend URL <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="https://my-backend.onrender.com"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Health Endpoint
                </label>
                <input
                  type="text"
                  placeholder="/health"
                  value={form.endpoint}
                  onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  HTTP Method
                </label>
                <select
                  value={form.method}
                  onChange={(e) => setForm({ ...form, method: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="HEAD">HEAD</option>
                </select>
              </div>
            </div>

            {/* Resolved Target URL Preview Helper */}
            {form.url && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <span className="text-slate-500">Resolved Request URL: </span>
                <span className="font-mono text-emerald-400 font-semibold break-all">
                  {(() => {
                    let base = form.url.trim();
                    if (!base.startsWith('http://') && !base.startsWith('https://')) base = `https://${base}`;
                    try {
                      const u = new URL(base);
                      const ep = form.endpoint ? form.endpoint.trim() : '';
                      if (u.pathname && u.pathname !== '/' && u.pathname !== '') {
                        if (!ep || ep === '/' || ep === u.pathname) return u.origin + u.pathname;
                        return `${u.origin}${u.pathname.replace(/\/+$/, '')}${ep.startsWith('/') ? ep : '/' + ep}`;
                      }
                      return `${u.origin}${ep ? (ep.startsWith('/') ? ep : '/' + ep) : ''}`;
                    } catch {
                      return `${base}${form.endpoint ? (form.endpoint.startsWith('/') ? form.endpoint : '/' + form.endpoint) : ''}`;
                    }
                  })()}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Check Interval
                </label>
                <select
                  value={form.interval_minutes}
                  onChange={(e) => setForm({ ...form, interval_minutes: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="5">Every 5 minutes</option>
                  <option value="10">Every 10 minutes (Recommended)</option>
                  <option value="15">Every 15 minutes</option>
                  <option value="30">Every 30 minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Expected Status
                </label>
                <input
                  type="number"
                  value={form.expected_status}
                  onChange={(e) => setForm({ ...form, expected_status: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Timeout (Seconds)
                </label>
                <input
                  type="number"
                  value={form.timeout_seconds}
                  onChange={(e) => setForm({ ...form, timeout_seconds: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="pt-3 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
              </button>

              <button
                type="button"
                onClick={handleTest}
                disabled={testing || !form.url}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
              >
                <Play className={`h-4 w-4 ${testing ? 'animate-spin' : 'text-emerald-400'}`} />
                <span>{testing ? 'Testing Live...' : 'Test Now'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Diagnostics Card */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Live Diagnostics</h2>
            
            <div className="mt-4 space-y-3">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="text-xs text-slate-500">Current Status</div>
                <div className="mt-1">
                  <StatusBadge status={service?.last_status} is_active={service?.is_active} />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="text-xs text-slate-500">Last Latency</div>
                <div className="mt-1 text-xl font-bold font-mono text-cyan-400">
                  {service?.last_latency_ms !== null && service?.last_latency_ms !== undefined ? (
                    `${service.last_latency_ms} ms`
                  ) : (
                    <span className="text-slate-600 text-sm">--</span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="text-xs text-slate-500">Last Checked</div>
                <div className="mt-1 text-xs font-mono text-slate-300">
                  {service?.last_checked_at ? new Date(service.last_checked_at).toLocaleString() : 'Never'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="text-xs text-slate-500">Next Scheduled Ping</div>
                <div className="mt-1 text-xs font-mono text-emerald-400">
                  {service?.next_ping_at ? new Date(service.next_ping_at).toLocaleTimeString() : 'Automatic'}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
            <span>Pings keep Render containers active before 15m idle shutdown.</span>
          </div>
        </div>
      </div>

      {/* Response Preview */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-emerald-400" />
            <h3 className="font-bold text-slate-200 text-sm">Latest Response Body</h3>
          </div>
          {recentChecks[0]?.status_code && (
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
              HTTP {recentChecks[0].status_code}
            </span>
          )}
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap break-all">
          {recentChecks[0]?.response_preview || (
            <span className="text-slate-600 italic">No response body captured yet.</span>
          )}
        </div>
      </div>

      {/* Recent History */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-4 shadow-xl">
        <h3 className="font-bold text-slate-200 text-sm">Recent Execution History</h3>
        
        {recentChecks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Latency</th>
                  <th className="pb-3 font-medium">HTTP Code</th>
                  <th className="pb-3 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentChecks.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 font-sans">
                      <StatusBadge status={c.status} is_active={true} />
                    </td>
                    <td className="py-2.5 text-cyan-400 font-bold">{c.latency_ms} ms</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] ${c.status_code >= 400 ? 'text-rose-400 bg-rose-500/10' : 'text-emerald-400 bg-emerald-500/10'}`}>
                        {c.status_code || '--'}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-400">{new Date(c.created_at).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 text-xs italic">
            No executions logged yet.
          </div>
        )}
      </div>
    </div>
  );
}
