import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/settings?ig_error=${error || 'cancelled'}`)
  }

  try {
    const appId = process.env.INSTAGRAM_APP_ID!
    const appSecret = process.env.INSTAGRAM_APP_SECRET!
    const redirectUri = `${baseUrl}/api/instagram/callback`

    // 1. Exchange code for short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
    )
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) throw new Error(tokenData.error?.message || 'Token exchange failed')

    // 2. Exchange for long-lived token (60 days)
    const longRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
    )
    const longData = await longRes.json()
    const accessToken = longData.access_token || tokenData.access_token

    // 3. Get Facebook Pages to find connected Instagram account
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`
    )
    const pagesData = await pagesRes.json()
    const pages = pagesData.data || []

    let igUserId = null
    let igUsername = null
    let pageAccessToken = accessToken

    // 4. For each page, check for connected Instagram Business Account
    for (const page of pages) {
      const igRes = await fetch(
        `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
      )
      const igData = await igRes.json()
      if (igData.instagram_business_account?.id) {
        igUserId = igData.instagram_business_account.id
        pageAccessToken = page.access_token

        // Get username
        const profileRes = await fetch(
          `https://graph.facebook.com/v19.0/${igUserId}?fields=username,followers_count&access_token=${pageAccessToken}`
        )
        const profile = await profileRes.json()
        igUsername = profile.username
        break
      }
    }

    if (!igUserId) {
      return NextResponse.redirect(`${baseUrl}/settings?ig_error=no_business_account`)
    }

    // 5. Upsert connection in Supabase
    await supabaseAdmin.from('instagram_connections').upsert({
      instagram_user_id: igUserId,
      instagram_username: igUsername,
      access_token: pageAccessToken,
      token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'instagram_user_id' })

    return NextResponse.redirect(`${baseUrl}/settings?ig_success=1&ig_user=${igUsername}`)
  } catch (e: any) {
    console.error('Instagram callback error:', e)
    return NextResponse.redirect(`${baseUrl}/settings?ig_error=${encodeURIComponent(e.message)}`)
  }
}
