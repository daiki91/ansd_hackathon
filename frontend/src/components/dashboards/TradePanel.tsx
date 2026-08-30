import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '@/api/client'
import { useApiData } from '@/hooks/useApiData'
import { StateMessage } from '@/components/StateMessage'
import { StatCard } from '@/components/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from './DataTable'
import type { TradeFlowType } from '@/api/types'

const FLOW_LABELS: Record<TradeFlowType, string> = {
  export: 'Exportations',
  import: 'Importations',
}

export function TradePanel() {
  const { data: rows, loading, error } = useApiData(() => api.getTradeFlows(), [])
  const [flowType, setFlowType] = useState<TradeFlowType>('export')

  const flowRows = useMemo(() => (rows ?? []).filter((row) => row.flow_type === flowType), [rows, flowType])
  const total = flowRows.find((row) => row.country === 'Total')
  const countryRows = flowRows.filter((row) => row.country !== 'Total')

  const chartData = useMemo(
    () =>
      countryRows
        .filter((row) => row.share_pct !== null)
        .sort((a, b) => (b.share_pct ?? 0) - (a.share_pct ?? 0))
        .map((row) => ({ name: row.country, share: row.share_pct ?? 0 })),
    [countryRows],
  )

  if (loading) return <StateMessage kind="loading" message="Chargement des données commerciales…" />
  if (error) return <StateMessage kind="error" message={error} />
  if (!rows) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-[var(--color-navy)]">Flux</label>
        <select
          value={flowType}
          onChange={(event) => setFlowType(event.target.value as TradeFlowType)}
          className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]"
        >
          <option value="export">Exportations</option>
          <option value="import">Importations</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          label={`${FLOW_LABELS[flowType]} totales (${total?.year ?? '—'})`}
          value={total?.value_fcfa_billions ? `${total.value_fcfa_billions.toLocaleString('fr-FR')} Mds FCFA` : '—'}
          accent="teal"
        />
        <StatCard label="Pays partenaires suivis" value={countryRows.length} accent="gold" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Principaux pays partenaires — {FLOW_LABELS[flowType]} ({total?.year ?? ''})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <StateMessage kind="empty" message="Aucune donnée disponible pour ce flux." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis unit="%" allowDecimals={false} />
                <Tooltip formatter={(value) => `${Number(value).toLocaleString('fr-FR')} %`} />
                <Bar dataKey="share" name="Part du commerce (%)" fill={flowType === 'export' ? '#0E7C7B' : '#C9962C'} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Détail des données</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rows={flowRows}
            rowKey={(row) => row.id}
            footnote="Les valeurs par pays sont calculées à partir des parts (%) publiées par la source et du total national."
            columns={[
              { key: 'country', label: 'Pays', render: (r) => r.country },
              { key: 'share', label: 'Part (%)', render: (r) => (r.share_pct !== null ? `${r.share_pct.toLocaleString('fr-FR')} %` : '—') },
              { key: 'value', label: 'Valeur (Mds FCFA)', render: (r) => (r.value_fcfa_billions !== null ? r.value_fcfa_billions.toLocaleString('fr-FR') : '—') },
              { key: 'year', label: 'Année', render: (r) => r.year },
              { key: 'source', label: 'Source', render: (r) => r.source, className: 'py-2 px-3 text-xs text-[var(--color-grey)]' },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
