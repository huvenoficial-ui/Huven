import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export const maxDuration = 60

async function scrapeProfile(username: string) {
  const res = await fetch('https://instagram120.p.rapidapi.com/api/instagram/userInfo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
      'x-rapidapi-host': 'instagram120.p.rapidapi.com',
    },
    body: JSON.stringify({ username }),
  })
  const data = await res.json()
  return data?.result?.[0]?.user || null
}

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json()
    if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 })

    const user = await scrapeProfile(username.replace('@', ''))
    if (!user) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const today = new Date().toISOString().split('T')[0]
    await supabaseAdmin.from('instagram_metrics').upsert({
      date: today,
      followers: user.follower_count,
      following: user.following_count,
      posts_count: user.media_count,
      avg_reach: null,
      avg_impressions: null,
    }, { onConflict: 'date' })

    await supabaseAdmin.from('instagram_profile').upsert({
      username: user.username,
      full_name: user.full_name,
      biography: user.biography,
      profile_pic_url: user.profile_pic_url,
      followers: user.follower_count,
      following: user.following_count,
      posts: user.media_count,
      is_verified: user.is_verified,
      last_synced: new Date().toISOString(),
    }, { onConflict: 'username' })

    return NextResponse.json({
      username: user.username,
      followers: user.follower_count,
      following: user.following_count,
      posts: user.media_count,
      bio: user.biography,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
