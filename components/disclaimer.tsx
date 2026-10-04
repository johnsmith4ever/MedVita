import { ShieldAlert } from 'lucide-react'

export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`rounded-2xl border border-vitaly-line bg-vitaly-paper/70 ${compact ? 'px-4 py-3' : 'px-4 py-4'}`}>
      <div className="flex items-start gap-2.5">
        <ShieldAlert size={16} className="mt-0.5 shrink-0 text-vitaly-muted" />
        <p className="text-[11px] leading-5 text-vitaly-muted">
          MedVita gives general reference information only. It is not a diagnosis. If this is an emergency, call 999 or go to A&amp;E.
        </p>
      </div>
    </div>
  )
}
