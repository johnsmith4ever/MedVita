import { ArrowLeft } from 'lucide-react'
import { DailyLimit } from './daily-limit'
import { MedVitaLogo } from './medvita-logo'

export function AppHeader({
  questionsUsed,
  diagnosesUsed,
  onBack,
}: {
  questionsUsed: number
  diagnosesUsed: number
  onBack?: () => void
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-vitaly-line/70 bg-vitaly-canvas backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="grid h-9 w-9 place-items-center rounded-full border border-vitaly-line text-vitaly-muted transition hover:bg-vitaly-surface hover:text-vitaly-ink"
              aria-label="Go back"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <MedVitaLogo />
        </div>
        <div className="flex items-center gap-2">
          <DailyLimit questionsUsed={questionsUsed} diagnosesUsed={diagnosesUsed} />
        </div>
      </div>
    </header>
  )
}
