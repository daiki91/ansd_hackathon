import { useMemo } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '@/api/client'
import { useApiData } from '@/hooks/useApiData'
import { StateMessage } from '@/components/StateMessage'
import { StatCard } from '@/components/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable } from './DataTable'

export function AgriculturePanel() {
  const { data: production, loading: loadingProduction, error: errorProduction } = useApiData(
    () => api.getAgricultureProduction(),
    [],
  )
  const { data: imports, loading: loadingImports, error: errorImports } = useApiData(
    () => api.getAgricultureImports(),
    [],
  )
  // Cas d'usage 2 du cahier des charges : Production agricole + Importations
  // -> taux de dépendance, croisement sur la dimension "année" (moteur de
  // croisement backend, voir backend/app/services/crossing/engine.py).
  const { data: crossing, loading: loadingCrossing, error: errorCrossing } = useApiData(
    () => api.runCrossing({ dataset_ids: ['production-agricole-cereales', 'importations-cereales'] }),
    [],
  )

  const loading = loadingProduction || loadingImports || loadingCrossing
  const error = errorProduction ?? errorImports ?? errorCrossing

  const chartData = useMemo(() => {
    if (!crossing) return []
    return Object.entries(crossing.joined_table)
      .map(([year, values]) => ({
        year,
        'Production nette (tonnes)': values['production-agricole-cereales'] ?? null,
        'Importations (tonnes)': values['importations-cereales'] ?? null,
      }))
      .sort((a, b) => Number(a.year) - Number(b.year))
  }, [crossing])

  const latestProduction = useMemo(
    () => [...(production ?? [])].sort((a, b) => b.year - a.year)[0],
    [production],
  )
  const latestImports = useMemo(() => [...(imports ?? [])].sort((a, b) => b.year - a.year)[0], [imports])
  const dependencyIndicator = crossing?.indicators?.[0] ?? null
  const latestDependency = dependencyIndicator
    ? [...dependencyIndicator.points].sort((a, b) => Number(b.zone) - Number(a.zone))[0]
    : null

  if (loading) return <StateMessage kind="loading" message="Chargement des données agricoles…" />
  if (error) return <StateMessage kind="error" message={error} />
  if (!production || !imports || !crossing) return null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label={`Production nette de céréales (${latestProduction?.year ?? '—'})`}
          value={latestProduction ? `${latestProduction.production_nette_tonnes.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} t` : '—'}
          accent="teal"
        />
        <StatCard
          label={`Importations de céréales (${latestImports?.year ?? '—'})`}
          value={latestImports ? `${latestImports.import_tonnes.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} t` : '—'}
          accent="gold"
        />
        <StatCard
          label={`Taux de dépendance aux importations (${latestDependency?.zone ?? '—'})`}
          value={latestDependency ? `${latestDependency.value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %` : '—'}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Production vs importations de céréales</CardTitle>
          <p className="text-xs text-[var(--color-grey)]">
            Cas d'usage 2 du cahier des charges — croisement automatique sur la dimension « année »
            {dependencyIndicator?.recipe_slug && (
              <span className="ml-1 text-[var(--color-teal)]">· indicateur reconnu : {dependencyIndicator.label}</span>
            )}
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="year" fontSize={12} />
              <YAxis unit=" t" />
              <Tooltip formatter={(value) => (value === null ? '—' : `${Number(value).toLocaleString('fr-FR')} t`)} />
              <Legend />
              <Line type="monotone" dataKey="Production nette (tonnes)" stroke="#0E7C7B" strokeWidth={2} connectNulls isAnimationActive={false} />
              <Line type="monotone" dataKey="Importations (tonnes)" stroke="#C9962C" strokeWidth={2} connectNulls isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-3 p-2.5 rounded-lg bg-[var(--color-navy)] text-white text-xs leading-relaxed">
            {crossing.interpretation}
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {crossing.sources.map((src) => (
              <Badge key={src} variant="outline" className="text-[9px]">{src}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Détail des données</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rows={chartData}
            rowKey={(row) => row.year}
            footnote="Sources : ANSD/DAPSA (BADIS 2018, tableaux G.02.01 et G.02.02)."
            columns={[
              { key: 'year', label: 'Année', render: (r) => r.year },
              { key: 'production', label: 'Production nette (t)', render: (r) => (r['Production nette (tonnes)'] !== null ? r['Production nette (tonnes)']!.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) : '—') },
              { key: 'imports', label: 'Importations (t)', render: (r) => (r['Importations (tonnes)'] !== null ? r['Importations (tonnes)']!.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) : '—') },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
