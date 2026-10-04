export function MedVitaMark({ size = 36 }: { size?: number }) {
  return (
    <div
      className="grid shrink-0 place-items-center rounded-2xl bg-vitaly-accent text-white shadow-sm"
      style={{ height: size, width: size }}
    >
      <svg width={size * 0.6} height={size * 0.34} viewBox="0 0 22 12" fill="none">
        <path
          d="M0 6h5l1.5-5 3 10L11.5 3l1.5 3h9"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

export function MedVitaLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <MedVitaMark size={36} />
      {!compact && <span className="font-serif text-[19px] font-medium tracking-[-0.01em]">MedVita</span>}
    </div>
  )
}
