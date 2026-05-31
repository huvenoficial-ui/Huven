import { NextResponse } from 'next/server'

export async function GET() {
  const appId = process.env.INSTAGRAM_APP_ID!
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!
  const redirectUri = `${baseUrl}/api/instagram/callback`

  const scopes = [
    'instagram_basic',
    'instagram_manage_comments',
    'instagram_manage_insights',
    'pages_show_list',
    'pages_read_engagement',
  ].join(',')

  const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code`

  return NextResponse.redirect(url)
}
