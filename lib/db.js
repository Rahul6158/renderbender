import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import os from 'os';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

let supabase = null;
if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

// Global In-Memory Cache (safe for serverless runtimes)
let memoryStore = {
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

// Safe fallback file path (uses /tmp on Vercel/serverless environments)
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production');
const LOCAL_STORE_FILE = isServerless
  ? path.join(os.tmpdir(), 'render_monitor_store.json')
  : path.join(process.cwd(), 'data', 'store.json');

function ensureLocalStore() {
  try {
    const dir = path.dirname(LOCAL_STORE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(LOCAL_STORE_FILE)) {
      fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(memoryStore, null, 2), 'utf-8');
    }
  } catch (err) {
    // Fail silently to in-memory store on restricted filesystems
  }
}

function readLocalStore() {
  try {
    ensureLocalStore();
    if (fs.existsSync(LOCAL_STORE_FILE)) {
      const content = fs.readFileSync(LOCAL_STORE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      memoryStore = {
        services: { ...memoryStore.services, ...(parsed.services || {}) },
        checks: parsed.checks || memoryStore.checks,
      };
    }
  } catch (err) {
    // Return in-memory store if file read fails
  }
  return memoryStore;
}

function writeLocalStore(data) {
  memoryStore = data;
  try {
    ensureLocalStore();
    fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // If disk write fails, memoryStore is still preserved in memory
  }
}

export async function getServices() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('services').select('*').order('id');
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn('Supabase query failed, using fallback:', err.message);
    }
  }

  const store = readLocalStore();
  return Object.values(store.services);
}

export async function getService(id) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('services').select('*').eq('id', id).single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase getService failed, using fallback:', err.message);
    }
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
    try {
      const { data, error } = await supabase
        .from('services')
        .upsert({ id, ...updatedData })
        .select()
        .single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase updateService failed, using fallback:', err.message);
    }
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
    try {
      const { data, error } = await supabase.from('checks').insert(checkRecord).select().single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase addCheck failed, using fallback:', err.message);
    }
  }

  const store = readLocalStore();
  store.checks.unshift(checkRecord);
  if (store.checks.length > 200) {
    store.checks = store.checks.slice(0, 200);
  }
  writeLocalStore(store);
  return checkRecord;
}

export async function getRecentChecks(serviceId, limit = 20) {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('checks').select('*').order('created_at', { ascending: false }).limit(limit);
      if (serviceId) {
        query = query.eq('service_id', serviceId);
      }
      const { data, error } = await query;
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase getRecentChecks failed, using fallback:', err.message);
    }
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
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .lte('next_ping_at', now.toISOString());
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase getDueServices failed, using fallback:', err.message);
    }
  }

  const services = await getServices();
  return services.filter((s) => {
    if (!s.is_active || !s.url) return false;
    if (!s.next_ping_at) return true;
    return new Date(s.next_ping_at) <= now;
  });
}
