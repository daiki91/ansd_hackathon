import type { ReactNode } from 'react'

export interface DataTableColumn<T> {
  key: string
  label: string
  render: (row: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  footnote?: string
}

export function DataTable<T>({ columns, rows, rowKey, footnote }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            {columns.map((col) => (
              <th key={col.key} className="py-2 px-3 font-semibold text-[var(--color-navy)]">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b last:border-0 hover:bg-[var(--color-lightbg)]">
              {columns.map((col) => (
                <td key={col.key} className={col.className ?? 'py-2 px-3'}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {footnote && <p className="text-xs text-[var(--color-grey)] mt-3">{footnote}</p>}
    </div>
  )
}
