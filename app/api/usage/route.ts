/**
 * app/api/usage/route.ts
 *
 * GET /api/usage
 * Returns the current user's daily usage.
 * Returns 0 used / 3 remaining when Supabase is not configured.
 */
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getUsage } from '@/lib/usage'
import { createServerClient } from '@/lib/supabase'
import { FOLLOWUPS_PER_DAY } from '@/lib/limits'

export async function GET() {
  const { userId, getToken } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clerkToken = await getToken()

  // If Supabase is not configured, return zeros
  if (!clerkToken || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({
      questionsUsed: 0,
      questionsRemaining: FOLLOWUPS_PER_DAY,
      lastResetDate: new Date().toISOString().slice(0, 10),
    })
  }

  const usage = await getUsage(clerkToken, userId)
  
  // Check how many diagnoses (triage cases) were performed today
  const today = new Date().toISOString().slice(0, 10)
  const db = createServerClient(clerkToken)
  let diagnosesUsed = 0
  if (db) {
    const { count } = await db
      .from('triage_cases')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00Z`)
    diagnosesUsed = count || 0
  }

  return NextResponse.json({
    questionsUsed: usage.questions_used,
    questionsRemaining: Math.max(0, FOLLOWUPS_PER_DAY - usage.questions_used),
    diagnosesUsed: diagnosesUsed,
    lastResetDate: usage.last_reset_date,
  })
}
