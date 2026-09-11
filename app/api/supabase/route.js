import { NextResponse } from 'next/server';
import { getService, updateService, addCheck, getRecentChecks } from '@/lib/db';
import { checkSupabaseService } from '@/lib/checker';

export async function GET() {
  try {
    const service = await getService('supabase');
    const recentChecks = await getRecentChecks('supabase', 15);

    // Mask the API key in client responses for safety
    const safeService = service ? {
      ...service,
      api_key_set: Boolean(service.api_key),
      api_key_preview: service.api_key ? `${service.api_key.slice(0, 6)}...${service.api_key.slice(-4)}` : '',
    } : null;

    return NextResponse.json({ service: safeService, recentChecks });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, ...configUpdates } = body;

    const current = await getService('supabase');

    // If api_key wasn't provided or was left blank, keep existing key
    if (!configUpdates.api_key && current?.api_key) {
      delete configUpdates.api_key;
    }

    // Action: 'test' -> run immediate check
    if (action === 'test') {
      const mergedConfig = { ...current, ...configUpdates };
      const checkResult = await checkSupabaseService(mergedConfig);

      const nextPing = new Date(Date.now() + (mergedConfig.interval_minutes || 10) * 60 * 1000).toISOString();

      await updateService('supabase', {
        last_status: checkResult.status,
        last_status_code: checkResult.status_code,
        last_latency_ms: checkResult.latency_ms,
        last_checked_at: new Date().toISOString(),
        next_ping_at: nextPing,
      });

      const savedCheck = await addCheck({
        service_id: 'supabase',
        ...checkResult,
      });

      return NextResponse.json({ success: true, check: savedCheck });
    }

    // Action: 'toggle' -> toggle is_active
    if (action === 'toggle') {
      const updated = await updateService('supabase', {
        is_active: !current.is_active,
      });
      return NextResponse.json({ success: true, service: updated });
    }

    // Default: update configuration
    const updated = await updateService('supabase', configUpdates);
    return NextResponse.json({ success: true, service: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
