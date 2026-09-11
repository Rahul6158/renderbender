import { NextResponse } from 'next/server';
import { getDueServices, updateService, addCheck } from '@/lib/db';
import { checkRenderService, checkSupabaseService } from '@/lib/checker';

export const dynamic = 'force-dynamic';

async function handleCron(request) {
  const cronSecret = process.env.CRON_SECRET;

  // Verify secret if configured
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    const url = new URL(request.url);
    const querySecret = url.searchParams.get('secret');

    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const providedSecret = bearerToken || querySecret;

    if (providedSecret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized: Invalid CRON_SECRET' }, { status: 401 });
    }
  }

  const dueServices = await getDueServices();
  const results = [];

  for (const service of dueServices) {
    let checkResult = null;
    if (service.id === 'render') {
      checkResult = await checkRenderService(service);
    } else if (service.id === 'supabase') {
      checkResult = await checkSupabaseService(service);
    }

    if (checkResult) {
      const nextPing = new Date(Date.now() + (service.interval_minutes || 10) * 60 * 1000).toISOString();

      await updateService(service.id, {
        last_status: checkResult.status,
        last_status_code: checkResult.status_code,
        last_latency_ms: checkResult.latency_ms,
        last_checked_at: new Date().toISOString(),
        next_ping_at: nextPing,
      });

      const savedCheck = await addCheck({
        service_id: service.id,
        ...checkResult,
      });

      results.push({
        service_id: service.id,
        name: service.name,
        status: checkResult.status,
        latency_ms: checkResult.latency_ms,
        status_code: checkResult.status_code,
        check_id: savedCheck.id,
      });
    }
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    executed_count: results.length,
    results,
  });
}

export async function GET(request) {
  return handleCron(request);
}

export async function POST(request) {
  return handleCron(request);
}
