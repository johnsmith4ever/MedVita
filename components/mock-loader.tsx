import { LoaderCircle } from 'lucide-react'

export function MockLoader() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-vitaly-canvas/94 px-6 backdrop-blur-sm fade-in">
      <div className="flex w-full max-w-sm flex-col items-center rounded-3xl border border-vitaly-line bg-vitaly-surface px-7 py-8 text-center shadow-soft">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-vitaly-accentSoft text-vitaly-accent">
          <LoaderCircle size={22} className="animate-spin" />
        </div>
        <p className="mt-5 font-serif text-lg font-medium tracking-[-0.01em]">Reviewing your symptoms</p>
        <p className="mt-1.5 max-w-xs text-sm leading-6 text-vitaly-muted">Cross-referencing your symptoms with the MedVita conditions database...</p>
      </div>
    </div>
  )
}
