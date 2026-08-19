import { useMemo } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../api/client'
import { useApiData } from '../hooks/useApiData'
import { StateMessage } from '../components/StateMessage'
import { StatCard } from '../components/StatCard'
import type { Indicator } from '../api/types'
import './pages.css'

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
    <div>
      <div className="page-header">
        <h1>Tableau de bord — Économie</h1>
        <p>
          Indicateurs économiques dynamiques du Sénégal (RF-13), suivis dans le temps pour permettre la
          comparaison entre périodes (RF-10).
        </p>
      </div>

      {loading ? <StateMessage kind="loading" message="Chargement des indicateurs économiques…" /> : null}
      {error ? <StateMessage kind="error" message={error} /> : null}

      {indicators ? (
        <>
          <div className="stat-row">
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

          <section className="section">
            <h2>Évolution de la croissance du PIB et de l'inflation</h2>
            <div className="chart-panel">
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
            </div>
          </section>

          <section className="section">
            <h2>Détail des données</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Indicateur</th>
                  <th>Valeur</th>
                  <th>Année</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {indicators.map((row) => (
                  <tr key={row.id}>
                    <td>{row.indicator}</td>
                    <td>
                      {row.value.toLocaleString('fr-FR')} {row.unit}
                    </td>
                    <td>{row.year}</td>
                    <td>{row.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      ) : null}
    </div>
  )
}
