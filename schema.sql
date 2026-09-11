-- ==========================================================
-- Schema for Render & Supabase Monitor
-- Run this in your Supabase Project SQL Editor
-- ==========================================================

-- 1. Services Configuration Table
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,                       -- 'render' or 'supabase'
  name TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  endpoint TEXT DEFAULT '',                  -- e.g. '/health' for Render
  api_key TEXT DEFAULT '',                   -- Supabase API Key (stored server-side)
  method TEXT DEFAULT 'GET',
  expected_status INT DEFAULT 200,
  interval_minutes INT DEFAULT 10,
  timeout_seconds INT DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  last_status TEXT DEFAULT 'Pending',        -- 'Healthy', 'Healthy (Slow)', 'Unhealthy', 'Unreachable', 'Connected'
  last_status_code INT,
  last_latency_ms INT,
  last_checked_at TIMESTAMPTZ,
  next_ping_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Health Checks History Log Table
CREATE TABLE IF NOT EXISTS checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  status TEXT NOT NULL,                      -- 'Healthy', 'Healthy (Slow)', 'Unhealthy', 'Unreachable', 'Connected'
  status_code INT,
  latency_ms INT NOT NULL,
  is_cold_start BOOLEAN DEFAULT false,
  response_preview TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast queries on recent checks
CREATE INDEX IF NOT EXISTS idx_checks_service_created ON checks (service_id, created_at DESC);

-- Seed default initial service rows if not present
INSERT INTO services (id, name, url, endpoint, interval_minutes, is_active, last_status)
VALUES 
  ('render', 'Render Backend', 'https://your-service.onrender.com', '/health', 10, false, 'Pending'),
  ('supabase', 'Supabase Project', 'https://your-project.supabase.co', '', 10, false, 'Pending')
ON CONFLICT (id) DO NOTHING;
