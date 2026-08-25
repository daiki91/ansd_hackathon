import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: ReactNode
  hint?: string
  accent?: 'navy' | 'teal' | 'gold'
}

const accentBorders: Record<string, string> = {
  navy: 'border-l-[var(--color-navy)]',
  teal: 'border-l-[var(--color-teal)]',
  gold: 'border-l-[var(--color-gold)]',
}

export function StatCard({ label, value, hint, accent = 'navy' }: StatCardProps) {
  return (
    <div className={cn(
      'bg-white border border-[#e2e7ee] border-l-4 rounded-lg px-5 py-4 min-w-[180px] flex-1',
      accentBorders[accent],
    )}>
      <p className="m-0 text-xs font-semibold text-[var(--color-grey)] uppercase tracking-wide mb-1.5">
        {label}
      </p>
      <p className="m-0 text-2xl font-extrabold text-[var(--color-navy)]">
        {value}
      </p>
      {hint && (
        <p className="m-0 mt-1 text-xs text-[var(--color-grey)]">{hint}</p>
      )}
    </div>
  )
}
