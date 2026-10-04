/**
 * app/api/follow-up/route.ts
 *
 * POST /api/follow-up
 * Body: { caseId, question, messages: { role, content }[], triageResult, caseInput, followUpsRemainingAfter? }
 *
 * Supabase is optional — if not configured, the response still works but
 * messages are not persisted.
 */
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { consumeQuestion } from '@/lib/usage'
import { generateFollowUp, normaliseResult, CaseInput } from '@/lib/ai'
import { createServerClient } from '@/lib/supabase'
import { FOLLOWUPS_PER_DAY } from '@/lib/limits'

export async function POST(req: NextRequest) {
  const { userId, getToken } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { caseId, question, messages, triageResult, caseInput, followUpsRemainingAfter } = body as {
    caseId?: string
    question: string
    messages: { role: 'user' | 'assistant'; content: string }[]
    triageResult: unknown
    caseInput?: CaseInput
    followUpsRemainingAfter?: number
  }

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return NextResponse.json({ error: 'question is required' }, { status: 400 })
  }

  // Get Clerk JWT (only needed if Supabase is configured)
  const clerkToken = await getToken()

  // Remaining follow-ups after this one (server value wins when Supabase is on)
  let remainingAfter = Math.max(0, Math.min(FOLLOWUPS_PER_DAY, Number(followUpsRemainingAfter) || 0))

  // Enforce daily limit (skipped gracefully if no Supabase)
  if (clerkToken) {
    try {
      const row = await consumeQuestion(clerkToken, userId)
      remainingAfter = Math.max(0, FOLLOWUPS_PER_DAY - row.questions_used)
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'DAILY_LIMIT_REACHED') {
        return NextResponse.json(
          { error: 'Daily question limit reached. Try again tomorrow.' },
          { status: 429 }
        )
      }
      throw err
    }
  }

  // Generate follow-up with the full case: original input + structured result + conversation
  const followUp = await generateFollowUp({
    triageResult: normaliseResult(triageResult),
    caseInput: caseInput ?? { symptoms: 'Not provided' },
    messages: Array.isArray(messages) ? messages : [],
    question: question.trim(),
    followUpsRemaining: remainingAfter,
  })

  // Persist message pair (skipped if Supabase not configured)
  if (caseId && clerkToken) {
    const db = createServerClient(clerkToken)
    if (db) {
      await db.from('follow_up_messages').insert([
        { case_id: caseId, user_id: userId, role: 'user', content: question },
        { case_id: caseId, user_id: userId, role: 'assistant', content: followUp.text },
      ])
    }
  }

  return NextResponse.json({ text: followUp.text })
}
