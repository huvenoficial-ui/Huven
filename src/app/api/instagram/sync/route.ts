import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export const maxDuration = 60

export async function POST() {
  try {
    const { data: conn } = await supabaseAdmin
      .from('instagram_connections')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!conn) return NextResponse.json({ error: 'No Instagram connection' }, { status: 400 })

    const { access_token, instagram_user_id } = conn

    // Fetch profile metrics
    const profileRes = await fetch(
      `https://graph.facebook.com/v19.0/${instagram_user_id}?fields=username,followers_count,follows_count,media_count,biography&access_token=${access_token}`
    )
    const profile = await profileRes.json()
    if (profile.error) throw new Error(profile.error.message)

    // Fetch insights (reach, impressions) — requires instagram_manage_insights
    let avgReach = null
    let avgImpressions = null
    try {
      const insightRes = await fetch(
        `https://graph.facebook.com/v19.0/${instagram_user_id}/insights?metric=reach,impressions&period=day&limit=7&access_token=${access_token}`
      )
      const insights = await insightRes.json()
      if (insights.data) {
        const reachData = insights.data.find((d: any) => d.name === 'reach')
        const impData = insights.data.find((d: any) => d.name === 'impressions')
        if (reachData?.values?.length) avgReach = reachData.values.reduce((s: number, v: any) => s + v.value, 0) / reachData.values.length
        if (impData?.values?.length) avgImpressions = impData.values.reduce((s: number, v: any) => s + v.value, 0) / impData.values.length
      }
    } catch { /* insights may not be available */ }

    // Save metrics to Supabase
    await supabaseAdmin.from('instagram_metrics').upsert({
      date: new Date().toISOString().split('T')[0],
      followers: profile.followers_count,
      following: profile.follows_count,
      posts_count: profile.media_count,
      avg_reach: avgReach,
      avg_impressions: avgImpressions,
    }, { onConflict: 'date' })

    // Fetch recent media and their comments
    const mediaRes = await fetch(
      `https://graph.facebook.com/v19.0/${instagram_user_id}/media?fields=id,caption,like_count,comments_count,timestamp&limit=10&access_token=${access_token}`
    )
    const mediaData = await mediaRes.json()
    const posts = mediaData.data || []

    let totalComments = 0
    for (const post of posts.slice(0, 5)) {
      const commentRes = await fetch(
        `https://graph.facebook.com/v19.0/${post.id}/comments?fields=id,text,username,timestamp&limit=50&access_token=${access_token}`
      )
      const commentData = await commentRes.json()
      const comments = commentData.data || []
      totalComments += comments.length

      for (const c of comments) {
        await supabaseAdmin.from('leads').upsert({
          handle: `@${c.username}`,
          text: c.text,
          score: 5,
          stage: 'novo',
          post: post.caption?.slice(0, 80) || post.id,
          notes: '',
          tags: [],
        }, { onConflict: 'handle,text' })
      }
    }

    return NextResponse.json({
      success: true,
      username: profile.username,
      followers: profile.followers_count,
      posts: posts.length,
      comments_imported: totalComments,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
