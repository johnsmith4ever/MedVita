import { CircleHelp } from 'lucide-react'

function Badge({
  left,
  max,
  label,
}: {
  left: number
  max: number
  label: string
}) {
  const exhausted = left === 0
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur ${
        exhausted
          ? 'border-vitaly-accent/30 bg-vitaly-accentSoft text-vitaly-accent'
          : 'border-vitaly-line bg-vitaly-surface/85 text-vitaly-muted'
      }`}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full ${exhausted ? 'bg-vitaly-accent/50' : 'bg-vitaly-accent/30'}`}
        />
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${exhausted ? 'bg-vitaly-accent' : 'bg-vitaly-accent'}`}
        />
      </span>
      {left}/{max} {label} left
      <CircleHelp size={13} className="opacity-60" />
    </div>
  )
}

export function DailyLimit({
  questionsUsed = 0,
  diagnosesUsed = 0,
}: {
  questionsUsed?: number
  diagnosesUsed?: number
}) {
  return (
    <div className="flex items-center gap-2">
      <Badge left={Math.max(2 - diagnosesUsed, 0)} max={2} label="diagnoses" />
      <Badge left={Math.max(3 - questionsUsed, 0)} max={3} label="questions" />
    </div>
  )
}
