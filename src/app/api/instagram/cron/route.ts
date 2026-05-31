import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export const maxDuration = 60

export async function GET() {
  try {
    const { data: profiles } = await supabaseAdmin
      .from('instagram_profile')
      .select('username')

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ message: 'No profiles to sync' })
    }

    const results = []
    for (const profile of profiles) {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/instagram/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: profile.username }),
      })
      const data = await res.json()
      results.push(data)
    }

    return NextResponse.json({ synced: results.length, results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
