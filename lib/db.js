import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const isSupabaseConfigured = Boolean(
  process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)
);

let supabase = null;
if (isSupabaseConfigured) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  supabase = createClient(process.env.SUPABASE_URL, key, {
    auth: { persistSession: false },
  });
}

// Local Fallback JSON Store Path
const LOCAL_STORE_FILE = path.join(process.cwd(), 'data', 'store.json');

function ensureLocalStore() {
  const dir = path.dirname(LOCAL_STORE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(LOCAL_STORE_FILE)) {
    const initialData = {
      services: {
        render: {
          id: 'render',
          name: 'Render Backend',
          url: '',
          endpoint: '/health',
          method: 'GET',
          expected_status: 200,
          interval_minutes: 10,
          timeout_seconds: 30,
          is_active: false,
          last_status: 'Not Configured',
          last_status_code: null,
          last_latency_ms: null,
          last_checked_at: null,
          next_ping_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        supabase: {
          id: 'supabase',
          name: 'Supabase Project',
          url: '',
          api_key: '',
          interval_minutes: 10,
          timeout_seconds: 30,
          is_active: false,
          last_status: 'Not Configured',
          last_status_code: null,
          last_latency_ms: null,
          last_checked_at: null,
          next_ping_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
      checks: [],
    };
    fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

function readLocalStore() {
  ensureLocalStore();
  try {
    const content = fs.readFileSync(LOCAL_STORE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading local store:', err);
    return { services: {}, checks: [] };
  }
}

function writeLocalStore(data) {
  ensureLocalStore();
  fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getServices() {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('services').select('*').order('id');
    if (error) {
      console.error('Supabase getServices error:', error);
      // Fallback to local store if Supabase table not created yet
      return Object.values(readLocalStore().services);
    }
    return data;
  }

  const store = readLocalStore();
  return Object.values(store.services);
}

export async function getService(id) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('services').select('*').eq('id', id).single();
    if (!error && data) return data;
  }

  const store = readLocalStore();
  return store.services[id] || null;
}

export async function updateService(id, updates) {
  const updatedData = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('services')
      .upsert({ id, ...updatedData })
      .select()
      .single();
    if (!error && data) return data;
  }

  const store = readLocalStore();
  store.services[id] = {
    ...(store.services[id] || { id }),
    ...updatedData,
  };
  writeLocalStore(store);
  return store.services[id];
}

export async function addCheck(check) {
  const checkRecord = {
    id: check.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `check_${Date.now()}`),
    service_id: check.service_id,
    status: check.status,
    status_code: check.status_code || null,
    latency_ms: check.latency_ms,
    is_cold_start: Boolean(check.is_cold_start),
    response_preview: check.response_preview ? String(check.response_preview).slice(0, 1500) : null,
    error_message: check.error_message || null,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('checks').insert(checkRecord).select().single();
    if (!error && data) return data;
  }

  const store = readLocalStore();
  store.checks.unshift(checkRecord);
  // Keep last 200 checks locally
  if (store.checks.length > 200) {
    store.checks = store.checks.slice(0, 200);
  }
  writeLocalStore(store);
  return checkRecord;
}

export async function getRecentChecks(serviceId, limit = 20) {
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from('checks').select('*').order('created_at', { ascending: false }).limit(limit);
    if (serviceId) {
      query = query.eq('service_id', serviceId);
    }
    const { data, error } = await query;
    if (!error && data) return data;
  }

  const store = readLocalStore();
  let checks = store.checks;
  if (serviceId) {
    checks = checks.filter((c) => c.service_id === serviceId);
  }
  return checks.slice(0, limit);
}

export async function getDueServices() {
  const now = new Date();

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .lte('next_ping_at', now.toISOString());
    if (!error && data) return data;
  }

  const services = await getServices();
  return services.filter((s) => {
    if (!s.is_active || !s.url) return false;
    if (!s.next_ping_at) return true;
    return new Date(s.next_ping_at) <= now;
  });
}
