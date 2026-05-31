import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const username = searchParams.get('username')

  // Get profile — if username specified use it, else get most followers
  const profileQuery = supabaseAdmin
    .from('instagram_profile')
    .select('*')
    .order('followers', { ascending: false })
    .limit(1)

  if (username) profileQuery.eq('username', username)

  const { data: profile } = await profileQuery.single()

  if (!profile) return NextResponse.json({ profile: null, metrics: [] })

  // Get metrics for this specific username (date range last 90 days)
  // We use a range filter since metrics don't have username yet — filter by known dates only
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)
  const cutoffStr = cutoff.toISOString().split('T')[0]

  const { data: metrics } = await supabaseAdmin
    .from('instagram_metrics')
    .select('date,followers,following,posts_count')
    .gte('date', cutoffStr)
    .order('date', { ascending: true })
    .limit(90)

  // Filter out rows that don't match this profile's follower range
  // (rough filter to exclude other accounts' data)
  const minF = profile.followers * 0.5
  const maxF = profile.followers * 1.5
  const filtered = (metrics || []).filter((m: any) =>
    m.followers >= minF && m.followers <= maxF
  )

  return NextResponse.json({ profile, metrics: filtered })
}
