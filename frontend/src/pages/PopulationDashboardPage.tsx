import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../api/client'
import { useApiData } from '../hooks/useApiData'
import { StateMessage } from '../components/StateMessage'
import { StatCard } from '../components/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'

export function PopulationDashboardPage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-navy)] flex items-center gap-2">
          <Users className="h-8 w-8 text-[var(--color-teal)]" />
          Tableau de bord — Population
        </h1>
        <p className="text-[var(--color-grey)] mt-1">
          Population résidente du Sénégal, base de croisement transversale avec les autres domaines (RGPH-5, 2023).
        </p>
      </div>

      {loading && <StateMessage kind="loading" message="Chargement des données de population…" />}
      {error && <StateMessage kind="error" message={error} />}

      {population && indicators && (
        <>
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
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 px-3 font-semibold text-[var(--color-navy)]">Région</th>
                    <th className="py-2 px-3 font-semibold text-[var(--color-navy)]">Population</th>
                    <th className="py-2 px-3 font-semibold text-[var(--color-navy)]">Part (%)</th>
                    <th className="py-2 px-3 font-semibold text-[var(--color-navy)]">Année</th>
                    <th className="py-2 px-3 font-semibold text-[var(--color-navy)]">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {population.map((row) => (
                    <tr key={row.id} className="border-b last:border-0 hover:bg-[var(--color-lightbg)]">
                      <td className="py-2 px-3">{row.region}</td>
                      <td className="py-2 px-3">{row.count.toLocaleString('fr-FR')}</td>
                      <td className="py-2 px-3">
                        {row.share_pct !== null ? `${row.share_pct.toLocaleString('fr-FR')} %` : '—'}
                      </td>
                      <td className="py-2 px-3">{row.year}</td>
                      <td className="py-2 px-3 text-xs text-[var(--color-grey)]">{row.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
