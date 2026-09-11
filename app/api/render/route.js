import { NextResponse } from 'next/server';
import { getService, updateService, addCheck, getRecentChecks } from '@/lib/db';
import { checkRenderService } from '@/lib/checker';

export async function GET() {
  try {
    const service = await getService('render');
    const recentChecks = await getRecentChecks('render', 15);
    return NextResponse.json({ service, recentChecks });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, ...configUpdates } = body;

    // Action: 'test' -> run immediate check
    if (action === 'test') {
      const current = await getService('render');
      const mergedConfig = { ...current, ...configUpdates };
      const checkResult = await checkRenderService(mergedConfig);

      const nextPing = new Date(Date.now() + (mergedConfig.interval_minutes || 10) * 60 * 1000).toISOString();

      await updateService('render', {
        last_status: checkResult.status,
        last_status_code: checkResult.status_code,
        last_latency_ms: checkResult.latency_ms,
        last_checked_at: new Date().toISOString(),
        next_ping_at: nextPing,
      });

      const savedCheck = await addCheck({
        service_id: 'render',
        ...checkResult,
      });

      return NextResponse.json({ success: true, check: savedCheck });
    }

    // Action: 'toggle' -> toggle is_active
    if (action === 'toggle') {
      const current = await getService('render');
      const updated = await updateService('render', {
        is_active: !current.is_active,
      });
      return NextResponse.json({ success: true, service: updated });
    }

    // Default: update configuration
    const updated = await updateService('render', configUpdates);
    return NextResponse.json({ success: true, service: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
