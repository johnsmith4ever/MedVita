/**
 * scripts/test_cache.ts
 * Run: npx tsx --env-file=.env.local scripts/test_cache.ts
 * Verifies Anthropic prompt caching: same triage twice, then 3 follow-ups in one case.
 * Look for the "[MedVita] cache usage" lines (cache_creation / cache_read / input tokens).
 */
import { triageSymptoms, generateFollowUp, type CaseInput } from '../lib/ai'

async function main() {
  const input: CaseInput = {
    symptoms:
      "I'm a teenager at school. For about 6 weeks I've been really tired, can't concentrate, get dizzy when I stand up, and people say I look pale. My mood is fine.",
    duration: '1-2 weeks',
    severity: 'Moderate',
    location: 'Other',
  }
  const triageParams = {
    symptoms: input.symptoms,
    duration: input.duration!,
    severity: input.severity!,
    location: input.location!,
  }

  console.log('--- triage call 1')
  const result = await triageSymptoms(triageParams)
  console.log('--- triage call 2 (identical request)')
  await triageSymptoms(triageParams)

  const history: { role: 'user' | 'assistant'; content: string }[] = []
  const questions = ['What can I do right now?', 'Is it serious?', 'What should I ask my GP?']
  for (let i = 0; i < questions.length; i++) {
    console.log(`--- follow-up ${i + 1}: ${questions[i]}`)
    const { text } = await generateFollowUp({
      triageResult: result,
      caseInput: input,
      messages: history,
      question: questions[i],
      followUpsRemaining: questions.length - i - 1,
    })
    history.push({ role: 'user', content: questions[i] }, { role: 'assistant', content: text })
  }
}

main()
