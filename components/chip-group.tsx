import { Check } from 'lucide-react'

export function ChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <p className="mb-2.5 text-sm font-semibold text-vitaly-ink">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value === option
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-all duration-150 ${
                active
                  ? 'border-vitaly-accent bg-vitaly-surface text-vitaly-accentDeep shadow-sm ring-1 ring-vitaly-accent/25'
                  : 'border-vitaly-line bg-vitaly-surface/60 text-vitaly-muted hover:border-vitaly-ink/20 hover:text-vitaly-ink'
              }`}
            >
              {active && <Check size={11} strokeWidth={3} />}
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}
