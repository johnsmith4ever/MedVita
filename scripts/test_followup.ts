/**
 * scripts/test_followup.ts
 * Run: npx tsx --env-file=.env.local scripts/test_followup.ts
 * Makes a handful of real Anthropic calls (1 triage + 4 follow-ups).
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

  console.log('=== TRIAGE ===')
  const result = await triageSymptoms({
    symptoms: input.symptoms,
    duration: input.duration!,
    severity: input.severity!,
    location: input.location!,
  })
  console.log(JSON.stringify(result, null, 2))

  const history: { role: 'user' | 'assistant'; content: string }[] = []
  const ask = async (question: string, remaining: number) => {
    const { text } = await generateFollowUp({
      triageResult: result,
      caseInput: input,
      messages: history,
      question,
      followUpsRemaining: remaining,
    })
    console.log(`\n=== Q: ${question} ===\n${text}`)
    history.push({ role: 'user', content: question }, { role: 'assistant', content: text })
  }

  await ask('What can I do right now which can help with my situation?', 2)
  await ask('I still don\'t understand', 1)
  await ask('Is it serious?', 0)
  await ask('Can you write me a Python script?', 0)
}

main()
