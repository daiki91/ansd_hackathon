import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../api/client'
import { useApiData } from '../hooks/useApiData'
import { StateMessage } from '../components/StateMessage'
import { StatCard } from '../components/StatCard'
import './pages.css'

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
    <div>
      <div className="page-header">
        <h1>Tableau de bord — Population</h1>
        <p>
          Population résidente du Sénégal, base de croisement transversale avec les autres domaines
          (RF-02, section 7 du cahier des charges), issue du 5e Recensement Général de la Population et
          de l'Habitat (RGPH-5, 2023).
        </p>
      </div>

      {loading ? <StateMessage kind="loading" message="Chargement des données de population…" /> : null}
      {error ? <StateMessage kind="error" message={error} /> : null}

      {population && indicators ? (
        <>
          <div className="stat-row">
            <StatCard
              label={`Population totale (${national?.year ?? '—'})`}
              value={national ? national.count.toLocaleString('fr-FR') : '—'}
              accent="teal"
            />
            <StatCard
              label="Croissance démographique annuelle"
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
              label="Espérance de vie à la naissance"
              value={
                findIndicator('Espérance de vie à la naissance')
                  ? `${findIndicator('Espérance de vie à la naissance')!.value.toLocaleString('fr-FR')} ans`
                  : '—'
              }
            />
          </div>

          <section className="section">
            <h2>Part de la population nationale par région ({national?.year})</h2>
            {chartData.length === 0 ? (
              <StateMessage kind="empty" message="Aucune donnée régionale disponible." />
            ) : (
              <div className="chart-panel">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis unit="%" allowDecimals={false} />
                    <Tooltip formatter={(value) => `${Number(value).toLocaleString('fr-FR')} %`} />
                    <Bar dataKey="share" name="Part de la population (%)" fill="#1B3358" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <p className="source-note">
              Seules les 3 régions les plus peuplées sont intégrées à ce stade (données d'amorçage) — voir
              le catalogue de données pour le détail et les limites de cette source.
            </p>
          </section>

          <section className="section">
            <h2>Détail des données</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Région</th>
                  <th>Population</th>
                  <th>Part (%)</th>
                  <th>Année</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {population.map((row) => (
                  <tr key={row.id}>
                    <td>{row.region}</td>
                    <td>{row.count.toLocaleString('fr-FR')}</td>
                    <td>{row.share_pct !== null ? `${row.share_pct.toLocaleString('fr-FR')} %` : '—'}</td>
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
