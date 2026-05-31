import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const username = searchParams.get('username')

  // Get profile — if username specified use it, else get most followers
  let profileQuery = supabaseAdmin
    .from('instagram_profile')
    .select('*')
    .order('followers', { ascending: false })
    .limit(1)

  if (username) profileQuery = profileQuery.eq('username', username)

  const { data: profile } = await profileQuery.single()

  if (!profile) return NextResponse.json({ profile: null, metrics: [] })

  // Get metrics for the last 90 days, filtered by username if the column exists
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)
  const cutoffStr = cutoff.toISOString().split('T')[0]

  let metricsQuery = supabaseAdmin
    .from('instagram_metrics')
    .select('date,followers,following,posts_count')
    .gte('date', cutoffStr)
    .order('date', { ascending: true })
    .limit(180)

  // Filter by username if the column exists in the table
  if (profile.username) {
    metricsQuery = metricsQuery.eq('username', profile.username)
  }

  const { data: metrics, error: metricsError } = await metricsQuery

  // If username column doesn't exist yet, fall back without filter
  const rows = metricsError
    ? (await supabaseAdmin
        .from('instagram_metrics')
        .select('date,followers,following,posts_count')
        .gte('date', cutoffStr)
        .order('date', { ascending: true })
        .limit(180)
      ).data || []
    : metrics || []

  return NextResponse.json({ profile, metrics: rows })
}
