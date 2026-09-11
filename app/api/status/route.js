import { NextResponse } from 'next/server';
import { getServices, getRecentChecks } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const servicesList = await getServices();
    const servicesMap = {};
    for (const s of servicesList) {
      servicesMap[s.id] = {
        ...s,
        // Mask Supabase key
        api_key_set: Boolean(s.api_key),
        api_key_preview: s.api_key ? `${s.api_key.slice(0, 6)}...${s.api_key.slice(-4)}` : '',
      };
    }

    const renderChecks = await getRecentChecks('render', 10);
    const supabaseChecks = await getRecentChecks('supabase', 10);

    return NextResponse.json({
      render: servicesMap['render'] || null,
      supabase: servicesMap['supabase'] || null,
      recentChecks: {
        render: renderChecks,
        supabase: supabaseChecks,
      },
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
