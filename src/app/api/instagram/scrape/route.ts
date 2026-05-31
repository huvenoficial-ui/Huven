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

    // Build historical points from post timestamps
    const engRate = engagementRate > 0 ? engagementRate / 100 : 0.02
    const now = Math.floor(Date.now() / 1000)
    const byDate: Record<string, number> = {}

    for (const post of posts) {
      if (!post.taken_at || !post.like_count) continue
      const daysAgo = Math.floor((now - post.taken_at) / 86400)
      if (daysAgo > 90) continue
      const dateStr = new Date(post.taken_at * 1000).toISOString().split('T')[0]
      const est = Math.round(post.like_count / engRate)
      const capped = Math.min(user.follower_count * 1.25, Math.max(user.follower_count * 0.75, est))
      byDate[dateStr] = Math.round(capped)
    }

    // Always include today with real count
    const today = new Date().toISOString().split('T')[0]
    byDate[today] = user.follower_count

    const rows = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, followers]) => ({
        date,
        followers,
        following: date === today ? user.following_count : null,
        posts_count: date === today ? user.media_count : null,
        avg_reach: null,
        avg_impressions: null,
      }))

    // Delete existing rows for these dates then insert fresh — no constraint needed
    const dates = rows.map(r => r.date)
    await supabaseAdmin.from('instagram_metrics').delete().in('date', dates)
    if (rows.length > 0) {
      await supabaseAdmin.from('instagram_metrics').insert(rows)
    }

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
    })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
