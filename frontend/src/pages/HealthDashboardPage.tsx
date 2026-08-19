import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../api/client'
import { useApiData } from '../hooks/useApiData'
import { StateMessage } from '../components/StateMessage'
import { StatCard } from '../components/StatCard'
import './pages.css'

export function HealthDashboardPage() {
  const { data: rows, loading, error } = useApiData(() => api.getHealthEstablishments(), [])
  const [region, setRegion] = useState<string>('National')

  const regions = useMemo(() => {
    if (!rows) return []
    return Array.from(new Set(rows.map((row) => row.region))).sort()
  }, [rows])

  const filteredRows = useMemo(() => {
    if (!rows) return []
    return rows.filter((row) => row.region === region)
  }, [rows, region])

  const chartData = useMemo(
    () => filteredRows.map((row) => ({ name: `${row.facility_type} (${row.year})`, count: row.count })),
    [filteredRows],
  )

  const totalFacilities = useMemo(
    () => filteredRows.reduce((sum, row) => sum + row.count, 0),
    [filteredRows],
  )

  return (
    <div>
      <div className="page-header">
        <h1>Tableau de bord — Santé</h1>
        <p>
          Répartition des établissements de santé du Sénégal par type et par région (RF-02, domaine « Santé »
          du cahier des charges).
        </p>
      </div>

      {loading ? <StateMessage kind="loading" message="Chargement des données de santé…" /> : null}
      {error ? <StateMessage kind="error" message={error} /> : null}

      {rows ? (
        <>
          <div className="filter-bar">
            <label>
              Région
              <select value={region} onChange={(event) => setRegion(event.target.value)}>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="stat-row">
            <StatCard label="Établissements (toutes catégories)" value={totalFacilities.toLocaleString('fr-FR')} accent="teal" />
            <StatCard label="Catégories suivies" value={filteredRows.length} accent="gold" />
            <StatCard label="Région sélectionnée" value={region} />
          </div>

          <section className="section">
            <h2>Établissements par type — {region}</h2>
            {chartData.length === 0 ? (
              <StateMessage kind="empty" message="Aucune donnée pour cette région." />
            ) : (
              <div className="chart-panel">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 60, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={80} fontSize={12} />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={(value) => Number(value).toLocaleString('fr-FR')} />
                    <Bar dataKey="count" name="Nombre d'établissements" fill="#0E7C7B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section className="section">
            <h2>Détail des données</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Région</th>
                  <th>Type d'établissement</th>
                  <th>Nombre</th>
                  <th>Année</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.region}</td>
                    <td>{row.facility_type}</td>
                    <td>{row.count.toLocaleString('fr-FR')}</td>
                    <td>{row.year}</td>
                    <td>{row.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="source-note">
              Traçabilité des sources (RNF-08) : les données affichées ci-dessus proviennent de l'ANSD et du
              Ministère de la Santé et de l'Action Sociale (MSAS) — voir la colonne « Source » et le catalogue
              de données pour le détail complet.
            </p>
          </section>
        </>
      ) : null}
    </div>
  )
}
