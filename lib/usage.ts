/**
 * lib/usage.ts
 *
 * Server-side helpers for the follow-up-questions-per-day limit (FOLLOWUPS_PER_DAY).
 * Both the initial symptom submission AND every follow-up count against the
 * same daily allowance — no separate buckets.
 *
 * Supabase table: daily_usage
 *   - user_id          text PRIMARY KEY
 *   - questions_used   integer NOT NULL DEFAULT 0
 *   - last_reset_date  date NOT NULL DEFAULT CURRENT_DATE
 */
import { createServerClient } from './supabase'
import { FOLLOWUPS_PER_DAY } from './limits'

export interface UsageRow {
  user_id: string
  questions_used: number
  last_reset_date: string
}

/**
 * Fetch the current usage for a user.
 * Resets the counter automatically when the date rolls over.
 */
export async function getUsage(clerkToken: string, userId: string): Promise<UsageRow> {
  const db = createServerClient(clerkToken)
  const today = new Date().toISOString().slice(0, 10)

  if (!db) {
    return { user_id: userId, questions_used: 0, last_reset_date: today }
  }

  const { data, error } = await db
    .from('daily_usage')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = row not found

  // No row yet — create one
  if (!data) {
    const fresh: UsageRow = { user_id: userId, questions_used: 0, last_reset_date: today }
    await db.from('daily_usage').insert(fresh)
    return fresh
  }

  // New day — reset counter
  if (data.last_reset_date !== today) {
    const reset: Partial<UsageRow> = { questions_used: 0, last_reset_date: today }
    await db.from('daily_usage').update(reset).eq('user_id', userId)
    return { ...data, ...reset } as UsageRow
  }

  return data as UsageRow
}

/**
 * Increment the question counter by 1.
 * Returns the updated row, or throws if the daily limit (3) is already reached.
 */
export async function consumeQuestion(clerkToken: string, userId: string): Promise<UsageRow> {
  const current = await getUsage(clerkToken, userId)

  if (current.questions_used >= FOLLOWUPS_PER_DAY) {
    throw new Error('DAILY_LIMIT_REACHED')
  }

  const db = createServerClient(clerkToken)
  const next = current.questions_used + 1

  if (db) {
    await db
      .from('daily_usage')
      .update({ questions_used: next })
      .eq('user_id', userId)
  }

  return { ...current, questions_used: next }
}
