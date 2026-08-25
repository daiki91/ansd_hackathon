import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '@/api/client'
import { useApiData } from '@/hooks/useApiData'
import { StateMessage } from '@/components/StateMessage'
import { StatCard } from '@/components/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from './DataTable'

export function HealthPanel() {
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

  if (loading) return <StateMessage kind="loading" message="Chargement des données de santé…" />
  if (error) return <StateMessage kind="error" message={error} />
  if (!rows) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-[var(--color-navy)]">Région</label>
        <select
          value={region}
          onChange={(event) => setRegion(event.target.value)}
          className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]"
        >
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Établissements (toutes catégories)" value={totalFacilities.toLocaleString('fr-FR')} accent="teal" />
        <StatCard label="Catégories suivies" value={filteredRows.length} accent="gold" />
        <StatCard label="Région sélectionnée" value={region} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Établissements par type — {region}</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <StateMessage kind="empty" message="Aucune donnée pour cette région." />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 60, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={80} fontSize={12} />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(value) => Number(value).toLocaleString('fr-FR')} />
                <Bar dataKey="count" name="Nombre d'établissements" fill="#0E7C7B" radius={[4, 4, 0, 0]} />
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
            rows={filteredRows}
            rowKey={(row) => row.id}
            footnote="Traçabilité des sources : les données proviennent de l'ANSD et du Ministère de la Santé et de l'Action Sociale (MSAS)."
            columns={[
              { key: 'region', label: 'Région', render: (r) => r.region },
              { key: 'type', label: "Type d'établissement", render: (r) => r.facility_type },
              { key: 'count', label: 'Nombre', render: (r) => r.count.toLocaleString('fr-FR') },
              { key: 'year', label: 'Année', render: (r) => r.year },
              { key: 'source', label: 'Source', render: (r) => r.source, className: 'py-2 px-3 text-xs text-[var(--color-grey)]' },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
