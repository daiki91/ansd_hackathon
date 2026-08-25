import type { ComponentType } from 'react'

interface PageHeaderProps {
  icon: ComponentType<{ className?: string }>
  title: string
  subtitle?: string
}

export function PageHeader({ icon: Icon, title, subtitle }: PageHeaderProps) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--color-navy)] flex items-center gap-2">
        <Icon className="h-8 w-8 text-[var(--color-teal)]" />
        {title}
      </h1>
      {subtitle && <p className="text-[var(--color-grey)] mt-1">{subtitle}</p>}
    </div>
  )
}
