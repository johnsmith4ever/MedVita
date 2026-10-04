import { Check } from 'lucide-react'
import { Fragment } from 'react'

export function StepTrack({ step }: { step: 1 | 2 | 3 }) {
  const steps = ['Symptoms', 'Result', 'Follow-up']
  return (
    <div className="mb-7 flex items-center gap-2.5">
      {steps.map((label, i) => {
        const n = i + 1
        const state = n < step ? 'done' : n === step ? 'active' : 'todo'
        return (
          <Fragment key={label}>
            <div className="flex items-center gap-2">
              <div
                className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold transition ${
                  state === 'active'
                    ? 'btn-gradient text-white'
                    : state === 'done'
                      ? 'bg-vitaly-accentSoft text-vitaly-accent'
                      : 'bg-vitaly-line text-vitaly-muted'
                }`}
              >
                {state === 'done' ? <Check size={12} strokeWidth={3} /> : n}
              </div>
              <span className={`text-xs font-medium ${state === 'todo' ? 'text-vitaly-muted' : 'text-vitaly-ink'}`}>{label}</span>
            </div>
            {n < steps.length && <div className={`h-px w-6 sm:w-10 ${n < step ? 'bg-vitaly-accent/40' : 'bg-vitaly-line'}`} />}
          </Fragment>
        )
      })}
    </div>
  )
}
