'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type PhotoData = { name: string; size: number; mime: string; dataUrl: string; base64: string }
import {
  Check,
  ChevronDown,
  ChevronUp,
  Cpu,
  Database,
  ArrowRight,
  ImagePlus,
  Info,
  MessageCircle,
  Moon,
  Plus,
  Send,
  Shield,
  Sparkles,
  Sun,
  Target,
  UploadCloud,
  X,
} from 'lucide-react'
import { SignInButton, useUser } from '@clerk/nextjs'
import { AppHeader } from '../components/header'
import { ChipGroup } from '../components/chip-group'
import { Disclaimer } from '../components/disclaimer'
import { MockLoader } from '../components/mock-loader'
import type { TriageResult, CaseInput } from '../lib/ai'
import { DIAGNOSES_PER_DAY, FOLLOWUPS_PER_DAY } from '../lib/limits'
import { ResultCard } from '../components/result-card'
import { MedVitaMark } from '../components/medvita-logo'
import { StepTrack } from '../components/step-track'
import { PhotoStrip } from '../components/photo-strip'
import { DISCLAIMER_SHORT, DISCLAIMER_LONG } from '../lib/constants'

type Screen = 'auth' | 'symptom' | 'results' | 'thread'

type Message = {
  id: number
  role: 'user' | 'assistant'
  text: string
}

const MOCK_RESULT: TriageResult = {
  urgencyTier: 'routine-gp',
  mostLikelyCause: 'Low iron (iron-deficiency anaemia)',
  actionSummary: 'Book a routine GP appointment within the next week or two for a blood test.',
  caseSummary:
    'Six weeks of persistent tiredness, poor concentration, dizziness on standing and pale skin.',
  severityScore: 4,
  context: [
    'Tiredness with pale skin and dizziness on standing often points to low iron or low blood count.',
    'Teenagers need more iron while growing, and menstruation can add to losses.',
    'Mood being unaffected makes a mood-related cause less likely.',
    'A simple blood test can confirm or rule out anaemia.',
  ],
  doNow: [
    'Eat iron-rich foods such as red meat, lentils, beans and fortified cereal, with vitamin C.',
    'Avoid tea and coffee with meals, as they reduce iron absorption.',
    'Stand up slowly, and sit down if you feel dizzy.',
    'Note when symptoms are worst and write down questions for the GP.',
    'Do not start iron tablets before the blood test without GP or pharmacist advice.',
  ],
  warningSigns: [
    'fainting',
    'chest pain',
    'breathlessness at rest',
    'a racing heartbeat (call 111, or 999 if severe)',
  ],
  explanations: [
    { title: 'Iron-deficiency anaemia', description: 'Low iron reduces haemoglobin, causing tiredness, pallor and dizziness.', likelihood: 'More likely' },
    { title: 'B12 or folate deficiency', description: 'Low vitamins can cause a similar tired, pale picture.', likelihood: 'Possible' },
    { title: 'Thyroid problems', description: 'An underactive thyroid can cause fatigue and poor concentration.', likelihood: 'Possible' },
    { title: 'Low blood pressure', description: 'Can cause dizziness on standing, usually without paleness.', likelihood: 'Less likely' },
  ],
  causes: [
    { title: 'Low iron intake', description: 'Diets low in meat, beans or leafy greens.' },
    { title: 'Heavy periods or blood loss', description: 'Regular blood loss can drain iron stores.' },
    { title: 'Growth spurt', description: 'Growing bodies need extra iron.' },
    { title: 'Poor sleep quality', description: 'Can add to tiredness and low concentration.' },
    { title: 'Recent illness', description: 'Infections can temporarily lower iron and energy.' },
  ],
}

const INITIAL_MESSAGES: Message[] = []

export default function HomePage() {
  const { isSignedIn, isLoaded, user } = useUser()
  const [screen, setScreen] = useState<Screen>('auth')
  // True once we've checked storage for a saved diagnosis session (so refresh doesn't flash the wrong page)
  const [restoreChecked, setRestoreChecked] = useState(false)
  const [hasResult, setHasResult] = useState(false)

  // If the user is already signed in, skip the landing page (after any saved session has been restored)
  useEffect(() => {
    if (isSignedIn && restoreChecked && screen === 'auth') {
      setScreen('symptom')
    }
  }, [isSignedIn, restoreChecked, screen])

  const [usedQuestions, setUsedQuestions] = useState(0)
  const [loading, setLoading] = useState(false)
  const [symptoms, setSymptoms] = useState('')
  const [duration, setDuration] = useState('A few days')
  const [severity, setSeverity] = useState('Moderate')
  const [location, setLocation] = useState('Chest')
  const [photo, setPhoto] = useState<PhotoData | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [triageResult, setTriageResult] = useState<TriageResult>(MOCK_RESULT)
  const [caseInput, setCaseInput] = useState<CaseInput>({ symptoms: 'Not provided' })
  const [caseId, setCaseId] = useState<string | null>(null)
  const [threadMessages, setThreadMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [followUp, setFollowUp] = useState('')

  const [hasDiagnosisToday, setHasDiagnosisToday] = useState(false)
  const [diagnosesUsed, setDiagnosesUsed] = useState(0)

  const canSend = useMemo(() => followUp.trim().length > 0 && usedQuestions < FOLLOWUPS_PER_DAY, [followUp, usedQuestions])

  // ── Session persistence: keep the last diagnosis across refreshes (per user, resets with the daily limit) ──
  const sessionKey = user?.id ? `medvita:session:${user.id}` : null

  useEffect(() => {
    if (!isLoaded) return
    if (sessionKey) {
      try {
        const raw = window.localStorage.getItem(sessionKey)
        if (raw) {
          const saved = JSON.parse(raw)
          if (saved.date === new Date().toISOString().slice(0, 10) && saved.triageResult) {
            setTriageResult(saved.triageResult)
            setCaseInput(saved.caseInput ?? { symptoms: 'Not provided' })
            setCaseId(saved.caseId ?? null)
            setThreadMessages(Array.isArray(saved.threadMessages) ? saved.threadMessages : [])
            setExpanded(Boolean(saved.expanded))
            setHasResult(true)
            setScreen(saved.screen === 'thread' || saved.screen === 'symptom' ? saved.screen : 'results')
          } else {
            window.localStorage.removeItem(sessionKey)
          }
        }
      } catch {
        /* corrupt or unavailable storage — start fresh */
      }
    }
    setRestoreChecked(true)
  }, [isLoaded, sessionKey])

  useEffect(() => {
    if (!restoreChecked || !sessionKey || !hasResult) return
    try {
      window.localStorage.setItem(
        sessionKey,
        JSON.stringify({
          date: new Date().toISOString().slice(0, 10),
          screen,
          triageResult,
          caseInput,
          caseId,
          threadMessages,
          expanded,
        })
      )
    } catch {
      /* storage full or unavailable — non-fatal */
    }
  }, [restoreChecked, sessionKey, hasResult, screen, triageResult, caseInput, caseId, threadMessages, expanded])

  // Fetch real usage from the server on mount (after sign-in)
  useEffect(() => {
    if (!isSignedIn) return
    fetch('/api/usage')
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.questionsUsed === 'number') {
          setUsedQuestions(data.questionsUsed)
        }
        if (typeof data.diagnosesUsed === 'number') {
          setDiagnosesUsed(data.diagnosesUsed)
          if (data.diagnosesUsed >= DIAGNOSES_PER_DAY) {
            setHasDiagnosisToday(true)
          }
        }
      })
      .catch(() => {/* usage fetch failed — stay at 0 */})
  }, [isSignedIn])

  const begin = () => setScreen('symptom')

  const submitSymptoms = async () => {
    const finalSymptoms = symptoms.trim() ||
      'I have had a dull discomfort that comes and goes. It is more noticeable after a busy day.'
    if (!symptoms.trim()) setSymptoms(finalSymptoms)

    setLoading(true)
    try {
      // NOTE: triage is free — the 3-question limit applies to follow-ups only
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: finalSymptoms,
          duration,
          severity,
          location,
          ...(photo ? { imageBase64: photo.base64, imageMimeType: photo.mime } : {}),
        }),
      })
      if (res.status === 429) {
        setDiagnosesUsed(DIAGNOSES_PER_DAY)
        setHasDiagnosisToday(true)
        setLoading(false)
        return
      }
      if (res.ok) {
        const data = await res.json()
        if (data.result) setTriageResult(data.result)
        if (data.caseId) setCaseId(data.caseId)
        // Remember exactly what was submitted, so follow-ups have the full case
        setCaseInput({
          symptoms: finalSymptoms,
          duration,
          severity,
          location,
          imageInsight: data.result?.imageInsight,
        })
        setThreadMessages([])
        setExpanded(false)
        setHasResult(true)
        setDiagnosesUsed((n) => n + 1)
      }
    } catch {
      // Network error — proceed to results with stub data
    } finally {
      setLoading(false)
      setScreen('results')
    }
  }

  const openThread = () => setScreen('thread')

  const sendFollowUp = async () => {
    if (!canSend) return

    const question = followUp.trim()
    // Optimistically add user message
    setThreadMessages((items) => [
      ...items,
      { id: Date.now(), role: 'user', text: question },
    ])
    setFollowUp('')

    try {
      const res = await fetch('/api/follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          question,
          triageResult,
          caseInput,
          followUpsRemainingAfter: Math.max(0, FOLLOWUPS_PER_DAY - usedQuestions - 1),
          messages: threadMessages.map((m) => ({ role: m.role, content: m.text })),
        }),
      })
      if (res.status === 429) {
        setThreadMessages((items) => [
          ...items,
          { id: Date.now() + 1, role: 'assistant', text: "You've reached today's limit. Please see your GP for further questions." },
        ])
        setUsedQuestions(FOLLOWUPS_PER_DAY)
        return
      }
      const data = res.ok ? await res.json() : null
      const replyText = data?.text ??
        'That detail could be useful to mention to your GP. Keep an eye on how the symptom changes and seek more urgent medical help if you develop concerning or rapidly worsening symptoms.'
      setThreadMessages((items) => [
        ...items,
        { id: Date.now() + 1, role: 'assistant', text: replyText },
      ])
    } catch {
      setThreadMessages((items) => [
        ...items,
        { id: Date.now() + 1, role: 'assistant', text: 'That detail could be useful to mention to your GP.' },
      ])
    }
    setUsedQuestions((current) => Math.min(current + 1, FOLLOWUPS_PER_DAY))
  }

  return (
    <main className={`min-h-screen bg-vitaly-canvas transition-colors duration-300`}>
      {loading && <MockLoader />}

      {screen === 'auth' && <Landing onEnter={begin} />}

      {screen === 'symptom' && (
        <div className="fade-in">
          <AppHeader questionsUsed={usedQuestions} diagnosesUsed={diagnosesUsed} />
          <SymptomScreen
            symptoms={symptoms}
            setSymptoms={setSymptoms}
            duration={duration}
            setDuration={setDuration}
            severity={severity}
            setSeverity={setSeverity}
            location={location}
            setLocation={setLocation}
            photo={photo}
            setPhoto={setPhoto}
            hasDiagnosisToday={hasDiagnosisToday}
            onSubmit={submitSymptoms}
          />
        </div>
      )}

      {screen === 'results' && (
        <div className="fade-in">
          <AppHeader questionsUsed={usedQuestions} diagnosesUsed={diagnosesUsed} onBack={() => setScreen('symptom')} />
          <ResultsScreen
            expanded={expanded}
            setExpanded={setExpanded}
            onAsk={openThread}
            onBack={() => setScreen('symptom')}
            result={triageResult}
          />
        </div>
      )}

      {screen === 'thread' && (
        <div className="fade-in">
          <AppHeader questionsUsed={usedQuestions} diagnosesUsed={diagnosesUsed} onBack={() => setScreen('results')} />
          <ThreadScreen
            messages={threadMessages}
            followUp={followUp}
            setFollowUp={setFollowUp}
            used={usedQuestions}
            canSend={canSend}
            onSend={sendFollowUp}
            result={triageResult}
          />
        </div>
      )}
    </main>
  )
}

type Tab = 'home' | 'why-us' | 'about' | 'what-we-do' | 'limits'

function Landing({ onEnter }: { onEnter: () => void }) {
  const [agreed, setAgreed] = useState(false)
  const [disclaimerExpanded, setDisclaimerExpanded] = useState(false)
  const bg = '#fbfaf6'
  const text = '#1c1b1a'
  const muted = '#726d66'
  const panelBg = '#ffffff'
  const panelBorder = '#e7e2da'
  const badgeBorder = '#e7e2da'
  const badgeBg = '#ffffff'
  const accentIcon = '#a8443f'
  const ctaBg = '#1c1b1a'
  const ctaText = '#ffffff'

  const trio = [
    {
      Icon: Database,
      title: 'MedlinePlus-grounded',
      body: 'Reference answers are checked against public MedlinePlus health information, not scraped from random forums.',
      color: '#3f5670',
      soft: '#e8eef4',
    },
    {
      Icon: Cpu,
      title: 'Runs on Claude Sonnet',
      body: "Anthropic's Claude Sonnet 5, set to high reasoning effort — built to think carefully, not to rush a guess.",
      color: '#a8443f',
      soft: '#f4e3e0',
    },
    {
      Icon: Target,
      title: 'Built for big clarity',
      body: 'One clear, tiered answer instead of twenty tabs of maybe. For people who want a straight read, fast.',
      color: '#9c6b2e',
      soft: '#f4ecdd',
    },
  ]

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: bg, color: text }}>
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <MedVitaMark size={30} />
          <span className="font-serif text-[17px] font-semibold tracking-[0.02em]" style={{ color: text }}>MEDVITA</span>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid w-full max-w-6xl gap-10 px-5 pb-20 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-[1.3fr_1fr] lg:items-start lg:gap-14">
        <div className="hero-rise relative" style={{ animationDelay: '0.05s' }}>
          <div className="pointer-events-none absolute -right-8 -top-8 hidden h-[280px] w-[260px] sm:block lg:-right-20 lg:-top-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/pills-mixed.jpg"
              alt=""
              className="absolute right-0 top-0 h-36 w-36 rotate-6 rounded-3xl border-4 border-[#fbfaf6] object-cover shadow-xl"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/blister-packs.jpg"
              alt=""
              className="absolute left-0 top-24 h-28 w-28 -rotate-6 rounded-3xl border-4 border-[#fbfaf6] object-cover shadow-lg opacity-95"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/pharmacy-shelf.jpg"
              alt=""
              className="absolute right-8 top-44 h-24 w-24 rotate-3 rounded-2xl border-4 border-[#fbfaf6] object-cover shadow-md opacity-90"
            />
          </div>

          <div
            className="mb-7 inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold"
            style={{ borderColor: badgeBorder, background: badgeBg, color: accentIcon }}
          >
            <Sparkles size={13} /> Calm Symptom Reference
          </div>

          <h1 className="font-sans text-[46px] font-extrabold leading-[1.02] tracking-[-0.03em] sm:text-[64px]">
            <span style={{ color: text }}>Understand what</span>
            <br />
            <span
              style={
                { backgroundImage: 'linear-gradient(120deg,#a8443f,#e2683c)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }
              }
            >
              to do next.
            </span>
          </h1>

          <p className="mt-6 max-w-md text-[15px] leading-7" style={{ color: muted }}>
            Stop guessing what a symptom means. MedVita&apos;s AI reads what you describe, checks it against public MedlinePlus health information, and gives you one clear, tiered answer — not twenty conflicting tabs.
          </p>

          <div
            className="mt-8 max-w-md rounded-[16px] border px-4 py-4 sm:px-5"
            style={{ background: '#f5f3ef', borderColor: panelBorder }}
          >
            <div className="flex items-start gap-3">
              <Info size={16} className="mt-[3px] shrink-0" style={{ color: muted }} />
              <div className="min-w-0">
                <p className="text-[14px] font-semibold" style={{ color: text }}>
                  {DISCLAIMER_SHORT}
                </p>

                <div className="mt-2 text-[13px] leading-relaxed" style={{ color: muted }}>
                  <p className={disclaimerExpanded ? '' : 'line-clamp-2'}>
                    {DISCLAIMER_LONG.split(' If you think')[0]}
                  </p>
                  <button
                    onClick={() => setDisclaimerExpanded(!disclaimerExpanded)}
                    className="mt-1 font-medium hover:underline"
                    style={{ color: text }}
                  >
                    {disclaimerExpanded ? 'Read less' : 'Read more'}
                  </button>
                  <p className="mt-2 font-medium" style={{ color: text }}>
                    If you think{DISCLAIMER_LONG.split(' If you think')[1]}
                  </p>
                </div>

                <label className="group -ml-2 mt-4 flex cursor-pointer items-start gap-3 rounded-xl p-2 transition hover:bg-black/5">
                  <div className="relative mt-[2px] flex h-5 w-5 shrink-0 items-center justify-center">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="peer absolute h-full w-full cursor-pointer appearance-none rounded-[5px] border-[1.5px] border-[#b3b0aa] bg-transparent outline-none transition-all duration-150 checked:border-vitaly-accent checked:bg-vitaly-accent focus-visible:ring-2 focus-visible:ring-vitaly-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f3ef]"
                    />
                    <Check size={12} strokeWidth={4} className="pointer-events-none absolute text-white opacity-0 transition-opacity duration-150 peer-checked:opacity-100" />
                  </div>
                  <span className="text-[13px] font-semibold" style={{ color: text }}>
                    I understand MedVita is a student-made project and can be wrong.
                  </span>
                </label>
              </div>
            </div>
          </div>

          {agreed ? (
            <SignInButton mode="modal" forceRedirectUrl="/">
              <button
                className="mt-7 inline-flex items-center gap-2.5 rounded-full px-6 py-4 text-sm font-bold shadow-lg transition hover:-translate-y-0.5"
                style={{ background: ctaBg, color: ctaText }}
              >
                Try it out <ArrowRight size={16} />
              </button>
            </SignInButton>
          ) : (
            <button
              disabled
              className="mt-7 inline-flex items-center gap-2.5 rounded-full px-6 py-4 text-sm font-bold shadow-lg transition opacity-50 cursor-not-allowed"
              style={{ background: ctaBg, color: ctaText }}
            >
              Try it out <ArrowRight size={16} />
            </button>
          )}
        </div>

        <div className="hero-rise rounded-3xl border p-6 sm:p-7" style={{ animationDelay: '0.15s', borderColor: panelBorder, background: panelBg }}>
          <div className="mb-5 flex items-center gap-2 text-base font-bold" style={{ color: text }}>
            <Shield size={18} style={{ color: accentIcon }} /> Why us?
          </div>
          <div className="space-y-5">
            {[
              { title: 'MedlinePlus-grounded, always', body: "We don't guess. Every reference answer is checked against public MedlinePlus health information before you see it." },
              { title: 'One clear answer', body: 'No twenty tabs, no maybe. A single tiered result — self-care to emergency — in plain language.' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border" style={{ borderColor: badgeBorder, color: accentIcon }}>
                  <Check size={13} strokeWidth={3} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: text }}>{item.title}</p>
                  <p className="mt-1 text-[13px] leading-5" style={{ color: muted }}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Photo strip ── */}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-0 pb-10 sm:pb-14">
        <p className="mb-4 px-5 text-[11px] font-semibold uppercase tracking-[0.1em] sm:px-8" style={{ color: muted }}>
          Public reference · MedlinePlus information
        </p>
        <PhotoStrip />
      </div>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-24 sm:px-8">
        <h2 className="text-2xl font-bold tracking-[-0.01em] sm:text-3xl" style={{ color: text }}>What&apos;s under the hood</h2>
        <p className="mt-2 max-w-lg text-sm leading-6" style={{ color: muted }}>Everything that makes a MedVita result different from a generic AI guess.</p>
        <div className="mt-9 grid gap-5 sm:grid-cols-3">
          {trio.map((item) => (
            <div key={item.title} className="card-tilt rounded-3xl border p-6" style={{ borderColor: panelBorder, background: panelBg }}>
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl" style={{ background: item.soft, color: item.color }}>
                <item.Icon size={20} />
              </div>
              <p className="text-sm font-semibold" style={{ color: text }}>{item.title}</p>
              <p className="mt-2 text-sm leading-6" style={{ color: muted }}>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t px-5 py-8 sm:px-8" style={{ borderColor: panelBorder }}>
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2.5">
          <MedVitaMark size={22} />
          <span className="font-serif text-[13px] font-semibold tracking-[0.02em]" style={{ color: muted }}>MEDVITA</span>
        </div>
        <p className="mx-auto mt-2 max-w-6xl text-[11px]" style={{ color: muted }}>© 2026 MedVita. Not a diagnosis — always see a clinician for medical advice.</p>
      </footer>
    </div>
  )
}

function SymptomScreen({
  symptoms,
  setSymptoms,
  duration,
  setDuration,
  severity,
  setSeverity,
  location,
  setLocation,
  photo,
  setPhoto,
  hasDiagnosisToday,
  onSubmit,
}: {
  symptoms: string
  setSymptoms: (value: string) => void
  duration: string
  setDuration: (value: string) => void
  severity: string
  setSeverity: (value: string) => void
  location: string
  setLocation: (value: string) => void
  photo: PhotoData | null
  setPhoto: (value: PhotoData | null) => void
  hasDiagnosisToday: boolean
  onSubmit: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoError, setPhotoError] = useState('')

  const handleFile = (file?: File) => {
    if (!file) return
    setPhotoError('')
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose an image file.')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setPhotoError('Image is too large (max 8 MB).')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result)
      setPhoto({
        name: file.name,
        size: file.size,
        mime: file.type,
        dataUrl,
        base64: dataUrl.split(',')[1] ?? '',
      })
    }
    reader.onerror = () => setPhotoError('Could not read that image.')
    reader.readAsDataURL(file)
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 pb-10 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <StepTrack step={1} />
        <div className="mb-7">
          <h1 className="font-serif text-3xl font-medium tracking-[-0.02em] sm:text-4xl">Start with the whole picture.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-vitaly-muted">Details can provide with more helpful info. Keep it in your own words.</p>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-vitaly-line bg-vitaly-surface p-4 shadow-soft sm:p-5">
            <label htmlFor="symptoms" className="mb-2 block text-sm font-semibold">What&apos;s going on?</label>
            <textarea
              id="symptoms"
              value={symptoms}
              onChange={(event) => setSymptoms(event.target.value)}
              rows={7}
              placeholder="Describe what's going on — when it started, what it feels like, anything that makes it better or worse."
              className="w-full resize-none rounded-2xl border border-transparent bg-vitaly-paper/60 px-4 py-4 text-sm leading-6 outline-none transition placeholder:text-vitaly-muted/70 focus:border-vitaly-accent focus:bg-vitaly-surface focus:ring-4 focus:ring-vitaly-accent/10"
            />
            <div className="mt-2 flex items-center justify-between text-[11px] text-vitaly-muted">
              <span>Plain language is perfect.</span>
              <span>{symptoms.length}/1200</span>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/heic,image/heif,image/*"
            className="hidden"
            onChange={(event) => {
              handleFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />
          {photoError && <p className="px-1 text-xs text-red-600">{photoError}</p>}
          {!photo ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                handleFile(event.dataTransfer.files?.[0])
              }}
              className="group w-full rounded-3xl border border-dashed border-vitaly-line bg-vitaly-paper/40 p-5 text-left transition hover:border-vitaly-accent/40 hover:bg-vitaly-surface"
            >
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-vitaly-surface text-vitaly-muted shadow-sm transition group-hover:text-vitaly-accent">
                  <UploadCloud size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Add a photo (recommended)</p>
                  <p className="mt-1 text-xs text-vitaly-muted">Drag &amp; drop or tap to add an image.</p>
                </div>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-4 rounded-3xl border border-vitaly-line bg-vitaly-surface p-4 shadow-sm">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-vitaly-paper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.dataUrl} alt="Uploaded preview" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{photo.name}</p>
                <p className="mt-1 text-xs leading-5 text-vitaly-muted">{(photo.size / 1024).toFixed(0)} KB · will be included in your check.</p>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-1 text-xs font-semibold text-vitaly-accent hover:underline">Replace</button>
              </div>
              <button type="button" onClick={() => setPhoto(null)} className="grid h-9 w-9 place-items-center rounded-full border border-vitaly-line text-vitaly-muted hover:text-vitaly-ink" aria-label="Remove photo">
                <X size={16} />
              </button>
            </div>
          )}

          <div className="rounded-3xl border border-vitaly-line bg-vitaly-surface p-5 sm:p-6">
            <div className="grid gap-6">
              <ChipGroup label="How long has this been going on?" options={['Today', 'A few days', '1-2 weeks', 'Longer']} value={duration} onChange={setDuration} />
              <ChipGroup label="How severe would you say it is?" options={['Mild', 'Moderate', 'Severe']} value={severity} onChange={setSeverity} />
              <ChipGroup label="Where is it, roughly?" options={['Skin', 'Head', 'Chest', 'Abdomen', 'Limbs', 'Other']} value={location} onChange={setLocation} />
            </div>
          </div>

          <Disclaimer />

          {hasDiagnosisToday ? (
            <div className="flex h-14 w-full items-center justify-center rounded-2xl border border-vitaly-accent bg-vitaly-accentSoft px-5 text-sm font-semibold text-vitaly-accent">
              Daily limit reached ({DIAGNOSES_PER_DAY}/day). Try again at midnight.
            </div>
          ) : (
            <button
              type="button"
              onClick={onSubmit}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-vitaly-accent px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-vitaly-accentDeep active:scale-[0.99]"
            >
              Check my symptoms
            </button>
          )}
          <p className="mt-3 text-center text-[11px] text-vitaly-muted">{DISCLAIMER_SHORT}</p>
        </div>
      </div>
    </section>
  )
}

function ResultsScreen({
  expanded,
  setExpanded,
  onAsk,
  onBack,
  result,
}: {
  expanded: boolean
  setExpanded: (value: boolean) => void
  onAsk: () => void
  onBack: () => void
  result: TriageResult
}) {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 pb-10 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <StepTrack step={2} />

        <ResultCard result={result} expanded={expanded} setExpanded={setExpanded} onAsk={onAsk} />

        <button
          type="button"
          onClick={onBack}
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-vitaly-line bg-vitaly-surface px-5 text-sm font-semibold text-vitaly-ink transition hover:bg-vitaly-paper/60"
        >
          Back to symptoms
        </button>
        <p className="mt-2 text-center text-[11px] text-vitaly-muted">This diagnosis has already counted towards today&apos;s limit of {DIAGNOSES_PER_DAY}.</p>
      </div>
    </section>
  )
}

function ThreadScreen({
  messages,
  followUp,
  setFollowUp,
  used,
  canSend,
  onSend,
  result,
}: {
  messages: Message[]
  followUp: string
  setFollowUp: (value: string) => void
  used: number
  canSend: boolean
  onSend: () => void
  result: TriageResult
}) {
  const limitReached = used >= FOLLOWUPS_PER_DAY

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 pb-10 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <StepTrack step={3} />
        <h1 className="mb-6 font-serif text-3xl font-medium tracking-[-0.02em] sm:text-4xl">Keep the context together.</h1>

        <div className="overflow-hidden rounded-[2rem] border border-vitaly-line bg-vitaly-surface shadow-soft">
          <div className="border-b border-vitaly-line bg-vitaly-paper/55 p-4 sm:p-5">
            <button type="button" className="w-full rounded-2xl border border-vitaly-line bg-vitaly-surface p-4 text-left transition hover:bg-vitaly-paper/50">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-vitaly-muted">Result context</p>
                  <p className="mt-1 truncate text-sm font-semibold">Most likely: {result.mostLikelyCause.replace(/^most likely:?\s*/i, '')}</p>
                </div>
                <ChevronDown size={16} className="shrink-0 text-vitaly-muted" />
              </div>
              <p className="mt-2 text-xs leading-5 text-vitaly-muted">{result.caseSummary}</p>
            </button>
          </div>

          <div className="min-h-[480px] space-y-4 p-4 sm:p-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[88%] items-end gap-2.5 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {message.role === 'assistant' && <div className="shrink-0"><MedVitaMark size={30} /></div>}
                  <div className={`${message.role === 'user' ? 'rounded-3xl rounded-br-md bg-vitaly-accent text-white' : 'rounded-3xl rounded-bl-md border border-vitaly-line bg-vitaly-paper/50 text-vitaly-ink'} px-4 py-3 text-sm leading-6`}>
                    {message.text}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-vitaly-line bg-vitaly-surface p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className={`text-[11px] font-medium ${limitReached ? 'text-vitaly-emergency' : 'text-vitaly-muted'}`}>{used} of {FOLLOWUPS_PER_DAY} questions used today</p>
              {!limitReached && <p className="text-[11px] text-vitaly-muted">Keep questions focused on this result.</p>}
            </div>

            {limitReached ? (
              <div className="rounded-2xl border border-vitaly-line bg-vitaly-paper/50 px-4 py-4 text-sm leading-6 text-vitaly-muted">
                You&apos;ve reached today&apos;s limit. For further questions, please see the recommended doctor type from the result: <span className="font-semibold text-vitaly-ink">your GP.</span>
              </div>
            ) : (
              <div className="flex items-end gap-2 rounded-2xl border border-vitaly-line bg-vitaly-paper/50 p-2 focus-within:border-vitaly-accent focus-within:bg-vitaly-surface focus-within:ring-4 focus-within:ring-vitaly-accent/10">
                <textarea
                  rows={2}
                  value={followUp}
                  onChange={(event) => setFollowUp(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      onSend()
                    }
                  }}
                  placeholder="Ask a follow-up question…"
                  className="min-h-[68px] flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 outline-none placeholder:text-vitaly-muted/70"
                />
                <button
                  type="button"
                  onClick={onSend}
                  disabled={!canSend}
                  className="btn-gradient grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white transition disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Send follow-up"
                >
                  <Send size={16} />
                </button>
              </div>
            )}

            <div className="mt-4 text-center">
              <Disclaimer compact />
              <p className="mt-3 text-[11px] text-vitaly-muted">{DISCLAIMER_SHORT}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
