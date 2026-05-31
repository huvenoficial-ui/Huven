import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export const maxDuration = 60

async function igPost(endpoint: string, body: object) {
  const res = await fetch(`https://instagram120.p.rapidapi.com${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
      'x-rapidapi-host': 'instagram120.p.rapidapi.com',
    },
    body: JSON.stringify(body),
  })
  return res.json()
}

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json()
    if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 })

    const handle = username.replace('@', '')

    // Fetch profile + posts in parallel
    const [profileData, postsData] = await Promise.all([
      igPost('/api/instagram/userInfo', { username: handle }),
      igPost('/api/instagram/posts', { username: handle }),
    ])

    const user = profileData?.result?.[0]?.user
    if (!user) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const edges = postsData?.result?.edges || []
    const posts = edges.map((e: any) => e.node).filter(Boolean)

    // Engagement metrics
    const totalLikes = posts.reduce((s: number, p: any) => s + (p.like_count || 0), 0)
    const totalComments = posts.reduce((s: number, p: any) => s + (p.comment_count || 0), 0)
    const avgLikes = posts.length > 0 ? Math.round(totalLikes / posts.length) : 0
    const avgComments = posts.length > 0 ? Math.round(totalComments / posts.length) : 0
    const engagementRate = user.follower_count > 0
      ? parseFloat((((avgLikes + avgComments) / user.follower_count) * 100).toFixed(2))
      : 0

    const today = new Date().toISOString().split('T')[0]

    // Backfill username on any existing rows that were saved without it (legacy data)
    await supabaseAdmin
      .from('instagram_metrics')
      .update({ username: user.username })
      .is('username', null)

    // Determine if this is the first sync using the profile's last_synced field
    const { data: existingProfile } = await supabaseAdmin
      .from('instagram_profile')
      .select('last_synced')
      .eq('username', user.username)
      .single()

    const isFirstSync = !existingProfile?.last_synced

    // Delete today's row for this account and re-insert with fresh real data
    await supabaseAdmin.from('instagram_metrics').delete()
      .eq('date', today)
      .eq('username', user.username)

    const todayRow = {
      date: today,
      username: user.username,
      followers: user.follower_count,
      following: user.following_count,
      posts_count: user.media_count,
      avg_reach: null,
      avg_impressions: null,
    }

    let rows: any[] = [todayRow]

    // Seed estimated history only on first-ever sync for this account
    if (isFirstSync) {
      const engRate = engagementRate > 0 ? engagementRate / 100 : 0.02
      const now = Math.floor(Date.now() / 1000)
      const byDate: Record<string, number> = {}

      for (const post of posts) {
        if (!post.taken_at || !post.like_count) continue
        const daysAgo = Math.floor((now - post.taken_at) / 86400)
        if (daysAgo > 90 || daysAgo === 0) continue
        const dateStr = new Date(post.taken_at * 1000).toISOString().split('T')[0]
        const est = Math.round(post.like_count / engRate)
        // Cap at ±30% to avoid wild outliers from viral posts
        const capped = Math.min(user.follower_count * 1.3, Math.max(user.follower_count * 0.7, est))
        byDate[dateStr] = Math.round(capped)
      }

      const historicalRows = Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, followers]) => ({
          date,
          username: user.username,
          followers,
          following: null,
          posts_count: null,
          avg_reach: null,
          avg_impressions: null,
        }))

      rows = [...historicalRows, todayRow]
    }

    await supabaseAdmin.from('instagram_metrics').insert(rows)

    // Update profile
    await supabaseAdmin.from('instagram_profile').upsert({
      username: user.username,
      full_name: user.full_name,
      biography: user.biography,
      profile_pic_url: user.profile_pic_url,
      followers: user.follower_count,
      following: user.following_count,
      posts: user.media_count,
      is_verified: user.is_verified,
      avg_likes: avgLikes,
      avg_comments: avgComments,
      engagement_rate: engagementRate,
      last_synced: new Date().toISOString(),
    }, { onConflict: 'username' })

    return NextResponse.json({
      username: user.username,
      followers: user.follower_count,
      following: user.following_count,
      posts: user.media_count,
      avgLikes,
      avgComments,
      engagementRate,
      historicalPoints: rows.length,
      seeded: isFirstSync,
    })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
