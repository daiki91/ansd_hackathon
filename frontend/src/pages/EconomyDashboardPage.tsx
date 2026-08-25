import { useMemo } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../api/client'
import { useApiData } from '../hooks/useApiData'
import { StateMessage } from '../components/StateMessage'
import { StatCard } from '../components/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import type { Indicator } from '../api/types'

export function EconomyDashboardPage() {
  const { data: indicators, loading, error } = useApiData(() => api.getIndicators({ category: 'Économie' }), [])

  const latestByIndicator = useMemo(() => {
    const map = new Map<string, Indicator>()
    for (const row of indicators ?? []) {
      const current = map.get(row.indicator)
      if (!current || row.year > current.year) map.set(row.indicator, row)
    }
    return map
  }, [indicators])

  const years = useMemo(() => {
    const set = new Set((indicators ?? []).map((row) => row.year))
    return Array.from(set).sort((a, b) => a - b)
  }, [indicators])

  const chartData = useMemo(
    () =>
      years.map((year) => {
        const pib = (indicators ?? []).find((row) => row.indicator === 'Croissance du PIB' && row.year === year)
        const inflation = (indicators ?? []).find((row) => row.indicator === 'Inflation' && row.year === year)
        return {
          year: String(year),
          'Croissance du PIB (%)': pib?.value ?? null,
          'Inflation (%)': inflation?.value ?? null,
        }
      }),
    [years, indicators],
  )

  const dette = latestByIndicator.get('Dette publique')
  const pib = latestByIndicator.get('Croissance du PIB')
  const inflation = latestByIndicator.get('Inflation')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-navy)] flex items-center gap-2">
          <TrendingUp className="h-8 w-8 text-[var(--color-teal)]" />
          Tableau de bord — Économie
        </h1>
        <p className="text-[var(--color-grey)] mt-1">
          Indicateurs économiques dynamiques du Sénégal, suivis dans le temps pour permettre la comparaison entre périodes.
        </p>
      </div>

      {loading && <StateMessage kind="loading" message="Chargement des indicateurs économiques…" />}
      {error && <StateMessage kind="error" message={error} />}

      {indicators && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label={`Croissance du PIB (${pib?.year ?? '—'})`}
              value={pib ? `${pib.value.toLocaleString('fr-FR')} %` : '—'}
              accent="teal"
            />
            <StatCard
              label={`Inflation (${inflation?.year ?? '—'})`}
              value={inflation ? `${inflation.value.toLocaleString('fr-FR')} %` : '—'}
              accent="gold"
            />
            <StatCard
              label={`Dette publique (${dette?.year ?? '—'})`}
              value={dette ? `${dette.value.toLocaleString('fr-FR')} % du PIB` : '—'}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Évolution de la croissance du PIB et de l'inflation</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="year" fontSize={12} />
                  <YAxis unit="%" />
                  <Tooltip formatter={(value) => (value === null ? '—' : `${Number(value).toLocaleString('fr-FR')} %`)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Croissance du PIB (%)"
                    stroke="#0E7C7B"
                    strokeWidth={2}
                    connectNulls
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Inflation (%)"
                    stroke="#C9962C"
                    strokeWidth={2}
                    connectNulls
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
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
                    <th className="py-2 px-3 font-semibold text-[var(--color-navy)]">Indicateur</th>
                    <th className="py-2 px-3 font-semibold text-[var(--color-navy)]">Valeur</th>
                    <th className="py-2 px-3 font-semibold text-[var(--color-navy)]">Année</th>
                    <th className="py-2 px-3 font-semibold text-[var(--color-navy)]">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {indicators.map((row) => (
                    <tr key={row.id} className="border-b last:border-0 hover:bg-[var(--color-lightbg)]">
                      <td className="py-2 px-3">{row.indicator}</td>
                      <td className="py-2 px-3">
                        {row.value.toLocaleString('fr-FR')} {row.unit}
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
