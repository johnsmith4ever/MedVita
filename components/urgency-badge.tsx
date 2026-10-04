import { AlertTriangle, CheckCircle2, Clock3, Siren } from 'lucide-react'

export type Urgency = 'self-care' | 'routine-gp' | 'urgent-specialist' | 'emergency'

const variants: Record<Urgency, {
  label: string
  sublabel: string
  text: string
  bg: string
  border: string
  icon: typeof CheckCircle2
}> = {
  'self-care': { label: 'Self-care', sublabel: 'Monitor at home', text: 'text-vitaly-moss', bg: 'bg-vitaly-mossSoft', border: 'border-vitaly-moss/25', icon: CheckCircle2 },
  'routine-gp': { label: 'Routine GP', sublabel: 'Arrange an appointment', text: 'text-vitaly-slate', bg: 'bg-vitaly-slateSoft', border: 'border-vitaly-slate/25', icon: Clock3 },
  'urgent-specialist': { label: 'Urgent specialist', sublabel: 'Seek prompt medical advice', text: 'text-vitaly-amber', bg: 'bg-vitaly-amberSoft', border: 'border-vitaly-amber/25', icon: AlertTriangle },
  emergency: { label: 'Emergency — call 999 / A&E', sublabel: 'Get urgent help now', text: 'text-white', bg: 'bg-vitaly-emergency', border: 'border-vitaly-emergency', icon: Siren },
}

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  const v = variants[urgency]
  const Icon = v.icon
  const emergency = urgency === 'emergency'

  return (
    <div className={`flex items-center justify-between gap-3 rounded-3xl border-2 px-4 py-4 ${v.bg} ${v.border} ${emergency ? 'text-white' : v.text}`}>
      <div className="flex items-center gap-3.5">
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${emergency ? 'bg-white/15' : 'bg-white/70'}`}>
          <Icon size={22} strokeWidth={2.2} />
        </div>
        <div>
          <p className="font-serif text-base font-medium tracking-[-0.01em]">{v.label}</p>
          <p className={`mt-0.5 text-xs ${emergency ? 'text-white/80' : 'opacity-75'}`}>{v.sublabel}</p>
        </div>
      </div>
      {emergency && <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-vitaly-emergency">Act now</span>}
    </div>
  )
}
