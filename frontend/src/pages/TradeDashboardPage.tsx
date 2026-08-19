import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../api/client'
import { useApiData } from '../hooks/useApiData'
import { StateMessage } from '../components/StateMessage'
import { StatCard } from '../components/StatCard'
import type { TradeFlowType } from '../api/types'
import './pages.css'

const FLOW_LABELS: Record<TradeFlowType, string> = {
  export: 'Exportations',
  import: 'Importations',
}

export function TradeDashboardPage() {
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

  return (
    <div>
      <div className="page-header">
        <h1>Tableau de bord — Commerce extérieur</h1>
        <p>
          Exportations et importations du Sénégal par pays partenaire (RF-02, domaine « Commerce extérieur »
          du cahier des charges).
        </p>
      </div>

      {loading ? <StateMessage kind="loading" message="Chargement des données commerciales…" /> : null}
      {error ? <StateMessage kind="error" message={error} /> : null}

      {rows ? (
        <>
          <div className="filter-bar">
            <label>
              Flux
              <select value={flowType} onChange={(event) => setFlowType(event.target.value as TradeFlowType)}>
                <option value="export">Exportations</option>
                <option value="import">Importations</option>
              </select>
            </label>
          </div>

          <div className="stat-row">
            <StatCard
              label={`${FLOW_LABELS[flowType]} totales (${total?.year ?? '—'})`}
              value={total?.value_fcfa_billions ? `${total.value_fcfa_billions.toLocaleString('fr-FR')} Mds FCFA` : '—'}
              accent="teal"
            />
            <StatCard label="Pays partenaires suivis" value={countryRows.length} accent="gold" />
          </div>

          <section className="section">
            <h2>
              Principaux pays partenaires — {FLOW_LABELS[flowType]} ({total?.year ?? ''})
            </h2>
            {chartData.length === 0 ? (
              <StateMessage kind="empty" message="Aucune donnée disponible pour ce flux." />
            ) : (
              <div className="chart-panel">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis unit="%" allowDecimals={false} />
                    <Tooltip formatter={(value) => `${Number(value).toLocaleString('fr-FR')} %`} />
                    <Bar
                      dataKey="share"
                      name="Part du commerce (%)"
                      fill={flowType === 'export' ? '#0E7C7B' : '#C9962C'}
                      radius={[4, 4, 0, 0]}
                    />
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
                  <th>Pays</th>
                  <th>Part (%)</th>
                  <th>Valeur (Mds FCFA)</th>
                  <th>Année</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {flowRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.country}</td>
                    <td>{row.share_pct !== null ? `${row.share_pct.toLocaleString('fr-FR')} %` : '—'}</td>
                    <td>{row.value_fcfa_billions !== null ? row.value_fcfa_billions.toLocaleString('fr-FR') : '—'}</td>
                    <td>{row.year}</td>
                    <td>{row.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="source-note">
              Les valeurs par pays sont calculées à partir des parts (%) publiées par la source et du total
              national de l'année — voir le catalogue de données pour le détail des sources et leurs limites.
            </p>
          </section>
        </>
      ) : null}
    </div>
  )
}
