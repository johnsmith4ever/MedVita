import { ChevronDown, ChevronUp, MessageCircle, Plus } from 'lucide-react'
import type { Likelihood, TriageResult } from '../lib/ai'
import { UrgencyBadge } from './urgency-badge'
import { SeverityBar } from './severity-bar'
import { DISCLAIMER_SHORT, DISCLAIMER_LONG } from '../lib/constants'

const LIKELIHOOD_STYLE: Record<Likelihood, string> = {
  'More likely': 'bg-vitaly-accentSoft text-vitaly-accent',
  Possible: 'bg-vitaly-slateSoft text-vitaly-slate',
  'Less likely': 'bg-vitaly-paper text-vitaly-muted ring-1 ring-inset ring-vitaly-line',
}

function SectionHeading({ id, children, hint }: { id: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <h2 id={id} className="text-[11px] font-semibold uppercase tracking-[0.1em] text-vitaly-ink">{children}</h2>
      {hint && <p className="mt-1 text-xs text-vitaly-muted">{hint}</p>}
    </div>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-6 text-vitaly-ink/85">
          <span aria-hidden="true" className="mt-[11px] h-1 w-1 shrink-0 rounded-full bg-vitaly-accent" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

/** Strips any "Most likely:" prefix so the UI controls the phrasing. */
function causeText(cause: string) {
  return cause.replace(/^most likely:?\s*/i, '').trim()
}

export function ResultCard({
  result,
  expanded,
  setExpanded,
  onAsk,
}: {
  result: TriageResult
  expanded: boolean
  setExpanded: (value: boolean) => void
  onAsk: () => void
}) {
  const doNow = [
    ...result.doNow,
    ...(result.warningSigns.length ? [`Seek urgent help if: ${result.warningSigns.join('; ')}`] : []),
  ]

  return (
    <div className="overflow-hidden rounded-[2rem] border border-vitaly-line bg-vitaly-surface">
      {/* 1–4: always visible */}
      <div className="p-4 sm:p-6">
        <UrgencyBadge urgency={result.urgencyTier} />
        
        <p className="mt-3 text-[11px] text-vitaly-muted">
          {result.urgencyTier === 'emergency' 
            ? "Don't delay getting help because of anything on this page."
            : DISCLAIMER_SHORT}
        </p>

        <h1 className="mt-5 font-serif text-[1.75rem] font-medium leading-[1.15] tracking-[-0.02em] text-vitaly-ink sm:text-4xl">
          Most likely: {causeText(result.mostLikelyCause)}
        </h1>

        <div className="mt-3 space-y-1">
          <p className="text-sm font-medium leading-6 text-vitaly-ink">{result.actionSummary}</p>
          <p className="text-sm leading-6 text-vitaly-muted">{result.caseSummary}</p>
        </div>

        <div className="mt-6">
          <SeverityBar score={result.severityScore} tier={result.urgencyTier} />
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-controls="result-details"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-vitaly-line px-3.5 py-2 text-xs font-semibold text-vitaly-ink transition hover:bg-vitaly-paper/60"
        >
          {expanded ? 'Show less' : 'Show more'}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* 5–9: collapsed by default */}
      {expanded && (
        <div id="result-details" className="panel-expand divide-y divide-vitaly-line border-t border-vitaly-line bg-vitaly-paper/45">
          {result.context.length > 0 && (
            <section aria-labelledby="sec-context" className="p-4 sm:p-6">
              <SectionHeading id="sec-context">Context</SectionHeading>
              <Bullets items={result.context} />
            </section>
          )}

          {doNow.length > 0 && (
            <section aria-labelledby="sec-donow" className="p-4 sm:p-6">
              <SectionHeading id="sec-donow">What you can do right now</SectionHeading>
              <Bullets items={doNow} />
            </section>
          )}

          {result.explanations.length > 0 && (
            <section aria-labelledby="sec-expl" className="p-4 sm:p-6">
              <SectionHeading id="sec-expl" hint="Examples only, not a diagnosis.">Possible explanations</SectionHeading>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {result.explanations.map((item) => (
                  <li key={item.title} className="flex flex-col rounded-2xl border border-vitaly-line bg-vitaly-surface p-4">
                    <span className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${LIKELIHOOD_STYLE[item.likelihood]}`}>
                      {item.likelihood}
                    </span>
                    <p className="mt-3 text-sm font-semibold leading-5">{item.title}</p>
                    <p className="mt-1.5 text-xs leading-5 text-vitaly-muted">{item.description}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.causes.length > 0 && (
            <section aria-labelledby="sec-causes" className="p-4 sm:p-6">
              <SectionHeading id="sec-causes" hint="Why this might have started.">Possible causes</SectionHeading>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {result.causes.map((cause) => (
                  <li key={cause.title} className="rounded-xl border border-vitaly-line bg-vitaly-surface px-3.5 py-3">
                    <p className="text-sm font-semibold leading-5">{cause.title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-vitaly-muted">{cause.description}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <div className="border-t border-vitaly-line p-4 sm:p-6">
        <div className="flex flex-col gap-3 rounded-3xl border border-vitaly-line bg-vitaly-paper/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-vitaly-surface text-vitaly-accent"><MessageCircle size={18} /></div>
            <div>
              <p className="text-sm font-semibold">Still unsure?</p>
              <p className="mt-1 text-xs leading-5 text-vitaly-muted">Ask a follow-up about this specific result.</p>
            </div>
          </div>
          <button onClick={onAsk} className="btn-gradient inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold text-white transition">
            Ask a follow-up
            <Plus size={14} />
          </button>
        </div>
        <p className="mt-4 text-[11px] leading-5 text-vitaly-muted">
          {DISCLAIMER_LONG}
        </p>
      </div>
    </div>
  )
}
