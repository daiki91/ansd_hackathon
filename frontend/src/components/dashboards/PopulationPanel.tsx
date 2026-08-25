import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '@/api/client'
import { useApiData } from '@/hooks/useApiData'
import { StateMessage } from '@/components/StateMessage'
import { StatCard } from '@/components/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from './DataTable'

export function PopulationPanel() {
  const { data: population, loading: loadingPopulation, error: errorPopulation } = useApiData(
    () => api.getPopulation(),
    [],
  )
  const { data: indicators, loading: loadingIndicators, error: errorIndicators } = useApiData(
    () => api.getIndicators({ category: 'Population' }),
    [],
  )

  const loading = loadingPopulation || loadingIndicators
  const error = errorPopulation ?? errorIndicators

  const national = population?.find((row) => row.region === 'National')
  const regionalRows = useMemo(
    () => (population ?? []).filter((row) => row.region !== 'National'),
    [population],
  )
  const chartData = useMemo(
    () => regionalRows.map((row) => ({ name: row.region, share: row.share_pct ?? 0 })),
    [regionalRows],
  )

  const findIndicator = (name: string) => indicators?.find((row) => row.indicator === name)

  if (loading) return <StateMessage kind="loading" message="Chargement des données de population…" />
  if (error) return <StateMessage kind="error" message={error} />
  if (!population || !indicators) return null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={`Population totale (${national?.year ?? '—'})`}
          value={national ? national.count.toLocaleString('fr-FR') : '—'}
          accent="teal"
        />
        <StatCard
          label="Croissance démographique"
          value={
            findIndicator('Taux de croissance démographique annuel')
              ? `${findIndicator('Taux de croissance démographique annuel')!.value.toLocaleString('fr-FR')} %/an`
              : '—'
          }
          accent="gold"
        />
        <StatCard
          label="Taux d'urbanisation"
          value={
            findIndicator("Taux d'urbanisation")
              ? `${findIndicator("Taux d'urbanisation")!.value.toLocaleString('fr-FR')} %`
              : '—'
          }
        />
        <StatCard
          label="Espérance de vie"
          value={
            findIndicator('Espérance de vie à la naissance')
              ? `${findIndicator('Espérance de vie à la naissance')!.value.toLocaleString('fr-FR')} ans`
              : '—'
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Part de la population nationale par région ({national?.year})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <StateMessage kind="empty" message="Aucune donnée régionale disponible." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis unit="%" allowDecimals={false} />
                <Tooltip formatter={(value) => `${Number(value).toLocaleString('fr-FR')} %`} />
                <Bar dataKey="share" name="Part de la population (%)" fill="#1B3358" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <p className="text-xs text-[var(--color-grey)] mt-3">
            Seules les 3 régions les plus peuplées sont intégrées à ce stade (données d'amorçage).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Détail des données</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rows={population}
            rowKey={(row) => row.id}
            columns={[
              { key: 'region', label: 'Région', render: (r) => r.region },
              { key: 'count', label: 'Population', render: (r) => r.count.toLocaleString('fr-FR') },
              { key: 'share', label: 'Part (%)', render: (r) => (r.share_pct !== null ? `${r.share_pct.toLocaleString('fr-FR')} %` : '—') },
              { key: 'year', label: 'Année', render: (r) => r.year },
              { key: 'source', label: 'Source', render: (r) => r.source, className: 'py-2 px-3 text-xs text-[var(--color-grey)]' },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
