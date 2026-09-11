'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import { Database, Play, Save, Pause, CheckCircle2, ShieldAlert, ArrowLeft, Zap, Clock, Code, Key, ShieldCheck } from 'lucide-react';

export default function SupabasePage() {
  const [form, setForm] = useState({
    url: '',
    api_key: '',
    interval_minutes: 10,
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
      const res = await fetch('/api/supabase');
      if (res.ok) {
        const json = await res.json();
        if (json.service) {
          setService(json.service);
          setForm((prev) => ({
            ...prev,
            url: json.service.url || '',
            interval_minutes: json.service.interval_minutes || 10,
            timeout_seconds: json.service.timeout_seconds || 30,
            is_active: json.service.is_active ?? true,
          }));
        }
        if (json.recentChecks) {
          setRecentChecks(json.recentChecks);
        }
      }
    } catch (err) {
      console.error('Failed to load Supabase config:', err);
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
      const res = await fetch('/api/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Supabase configuration saved securely!' });
        // Clear plaintext key from state after saving
        setForm((prev) => ({ ...prev, api_key: '' }));
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
      const res = await fetch('/api/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', ...form }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({
          type: 'success',
          text: `Connectivity Test: ${json.check.status} (${json.check.latency_ms}ms, HTTP ${json.check.status_code || '--'})`,
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
      const res = await fetch('/api/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle' }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({
          type: 'success',
          text: `Supabase monitoring is now ${json.service.is_active ? 'ACTIVE' : 'PAUSED'}.`,
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
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400 hover:text-teal-300 mb-2 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Supabase Connectivity Monitor</h1>
              <p className="text-xs text-slate-400">Regularly verify Supabase database connectivity & response latency</p>
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
                  : 'bg-teal-600 text-white border-teal-500 hover:bg-teal-500'
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
              ? 'bg-teal-500/10 border-teal-500/30 text-teal-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-teal-400 flex-shrink-0" />
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
          <h2 className="text-lg font-bold text-slate-100">Project Configuration</h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Supabase Project URL <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="https://your-project.supabase.co"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Supabase API Key (Anon / Service Role)</span>
                {service?.api_key_set && (
                  <span className="text-[11px] text-teal-400 font-mono flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Key Stored ({service.api_key_preview})
                  </span>
                )}
              </label>
              <input
                type="password"
                placeholder={service?.api_key_set ? "••••••••••••••••••••••••••••••••" : "Paste your Supabase API key..."}
                value={form.api_key}
                onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 font-mono"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Stored strictly server-side. Used to send authenticated health pings to <code className="text-slate-400">/rest/v1/</code>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Check Interval
                </label>
                <select
                  value={form.interval_minutes}
                  onChange={(e) => setForm({ ...form, interval_minutes: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-sm text-slate-100 focus:outline-none focus:border-teal-500 font-mono"
                >
                  <option value="5">Every 5 minutes</option>
                  <option value="10">Every 10 minutes (Recommended)</option>
                  <option value="15">Every 15 minutes</option>
                  <option value="30">Every 30 minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Timeout (Seconds)
                </label>
                <input
                  type="number"
                  value={form.timeout_seconds}
                  onChange={(e) => setForm({ ...form, timeout_seconds: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-sm text-slate-100 focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>
            </div>

            <div className="pt-3 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-600/20 transition disabled:opacity-50"
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
                <Play className={`h-4 w-4 ${testing ? 'animate-spin' : 'text-teal-400'}`} />
                <span>{testing ? 'Testing Live...' : 'Test Connectivity'}</span>
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
                <div className="text-xs text-slate-500">Connection Status</div>
                <div className="mt-1">
                  <StatusBadge status={service?.last_status} is_active={service?.is_active} />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="text-xs text-slate-500">Response Latency</div>
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
                <div className="mt-1 text-xs font-mono text-teal-400">
                  {service?.next_ping_at ? new Date(service.next_ping_at).toLocaleTimeString() : 'Automatic'}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-teal-400 flex-shrink-0" />
            <span>Sends lightweight authenticated pings to check database reachability.</span>
          </div>
        </div>
      </div>

      {/* Response Preview */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-teal-400" />
            <h3 className="font-bold text-slate-200 text-sm">Latest Supabase REST Response</h3>
          </div>
          {recentChecks[0]?.status_code && (
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-400 border border-slate-700">
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
        <h3 className="font-bold text-slate-200 text-sm">Recent Connectivity History</h3>
        
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
                      <span className={`px-2 py-0.5 rounded text-[11px] ${c.status_code >= 400 ? 'text-rose-400 bg-rose-500/10' : 'text-teal-400 bg-teal-500/10'}`}>
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
            No connectivity checks logged yet.
          </div>
        )}
      </div>
    </div>
  );
}
