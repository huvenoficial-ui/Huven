import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  const [{ data: profile }, { data: metrics }] = await Promise.all([
    supabaseAdmin.from('instagram_profile').select('*').order('last_synced', { ascending: false }).limit(1).single(),
    supabaseAdmin.from('instagram_metrics').select('date,followers,following,posts_count').order('date', { ascending: true }).limit(90),
  ])
  return NextResponse.json({ profile: profile || null, metrics: metrics || [] })
}
