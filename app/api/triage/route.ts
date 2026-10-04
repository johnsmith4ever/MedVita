/**
 * app/api/triage/route.ts
 *
 * POST /api/triage
 * Body: { symptoms, duration, severity, location, imageBase64?, imageMimeType? }
 *
 * NOTE: The initial symptom submission does NOT count against the 5-question
 * follow-up limit. Only /api/follow-up deducts from the daily allowance.
 *
 * 1. Validates the Clerk session
 * 2. Optionally analyses an image with Gemini Flash
 * 3. Runs symptom triage with Claude Sonnet (or stub)
 * 4. Persists the triage_case row in Supabase (if configured)
 * 5. Returns the triage result
 */
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { analyseImage, triageSymptoms } from '@/lib/ai'
import { createServerClient } from '@/lib/supabase'
import { DIAGNOSES_PER_DAY } from '@/lib/limits'

export async function POST(req: NextRequest) {
  const { userId, getToken } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { symptoms, duration, severity, location, imageBase64, imageMimeType } = body

  if (!symptoms || typeof symptoms !== 'string' || symptoms.trim().length === 0) {
    return NextResponse.json({ error: 'symptoms is required' }, { status: 400 })
  }

  // Enforce 1 diagnosis per day limit
  const clerkToken = await getToken()
  let db = null
  if (clerkToken) {
    db = createServerClient(clerkToken)
    if (db) {
      const today = new Date().toISOString().slice(0, 10)
      const { count } = await db
        .from('triage_cases')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', `${today}T00:00:00Z`)

      if (count && count >= DIAGNOSES_PER_DAY) {
        return NextResponse.json({ error: 'DAILY_DIAGNOSIS_LIMIT_REACHED' }, { status: 429 })
      }
    }
  }

  // Optional image analysis via Gemini (after the limit check to avoid wasted calls)
  let imageInsight: string | undefined
  if (imageBase64 && imageMimeType) {
    imageInsight = await analyseImage(imageBase64, imageMimeType)
  }

  // Run triage via Claude Sonnet (falls back to stub if key absent)
  const result = await triageSymptoms({ symptoms, duration, severity, location, imageInsight })

  // Persist to Supabase (skipped gracefully if not configured)
  if (db) {
    const { data: triageCase, error: insertError } = await db
      .from('triage_cases')
      .insert({
        user_id: userId,
        symptoms: symptoms.trim(),
        duration,
        severity,
        location,
        image_insight: imageInsight ?? null,
        urgency: result.urgencyTier,
        action: result.actionSummary,
        result_json: result,
      })
      .select('id')
      .single()

    if (!insertError) {
      return NextResponse.json({ result, caseId: triageCase?.id })
    }
    console.error('[triage] Supabase insert error:', insertError)
  }

  return NextResponse.json({ result })
}
