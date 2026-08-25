import { cn } from '@/lib/utils'
import { Loader2, AlertCircle, Inbox } from 'lucide-react'

interface StateMessageProps {
  kind: 'loading' | 'error' | 'empty'
  message: string
}

const kindStyles: Record<string, string> = {
  loading: 'text-[var(--color-grey)]',
  error: 'bg-red-50 text-red-700 border border-red-200',
  empty: 'text-[var(--color-grey)] border border-dashed border-[#d3dae2]',
}

export function StateMessage({ kind, message }: StateMessageProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2 p-6 rounded-lg text-sm text-center', kindStyles[kind])}>
      {kind === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
      {kind === 'error' && <AlertCircle className="h-4 w-4" />}
      {kind === 'empty' && <Inbox className="h-4 w-4" />}
      {message}
    </div>
  )
}
