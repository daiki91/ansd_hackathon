import type { ReactNode } from 'react'
import './StatCard.css'

interface StatCardProps {
  label: string
  value: ReactNode
  hint?: string
  accent?: 'navy' | 'teal' | 'gold'
}

export function StatCard({ label, value, hint, accent = 'navy' }: StatCardProps) {
  return (
    <div className={`stat-card stat-card--${accent}`}>
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value">{value}</p>
      {hint ? <p className="stat-card__hint">{hint}</p> : null}
    </div>
  )
}
