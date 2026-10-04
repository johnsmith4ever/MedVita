import type { Urgency } from '../lib/ai'

const SEGMENT_COLOURS = [
  '#7f9c70', '#8aa26a', '#97a763', '#a9ab5c', '#bfae53',
  '#cba449', '#c98d40', '#c2733a', '#b65c35', '#a4432f',
]

export function severityLabel(score: number): 'Low' | 'Moderate' | 'High' | 'Critical' {
  if (score <= 3) return 'Low'
  if (score <= 5) return 'Moderate'
  if (score <= 8) return 'High'
  return 'Critical'
}

const LABEL_TEXT: Record<ReturnType<typeof severityLabel>, string> = {
  Low: 'text-vitaly-moss',
  Moderate: 'text-vitaly-amber',
  High: 'text-vitaly-accent',
  Critical: 'text-vitaly-emergency',
}

/** 10-segment severity bar with a text alternative. `tier` is accepted for future styling hooks. */
export function SeverityBar({ score, tier }: { score: number; tier?: Urgency }) {
  const clamped = Math.min(10, Math.max(1, Math.round(score)))
  const label = severityLabel(clamped)

  return (
    <div data-tier={tier}>
      <div className="flex items-center gap-3">
        <div
          role="img"
          aria-label={`Severity ${clamped} out of 10, ${label}`}
          className="flex flex-1 gap-1"
        >
          {SEGMENT_COLOURS.map((colour, i) => (
            <span
              key={colour}
              aria-hidden="true"
              className="h-2.5 flex-1 rounded-full transition-colors duration-500"
              style={{ backgroundColor: i < clamped ? colour : 'rgba(120, 108, 92, 0.16)' }}
            />
          ))}
        </div>
        <p className="shrink-0 text-sm font-semibold tabular-nums text-vitaly-ink">
          {clamped} <span className="text-vitaly-muted">/ 10</span>
        </p>
        <span className={`shrink-0 text-xs font-semibold uppercase tracking-[0.08em] ${LABEL_TEXT[label]}`}>{label}</span>
      </div>
      <p className="mt-2 text-[11px] text-vitaly-muted">How concerning this looks, not a diagnosis.</p>
    </div>
  )
}
