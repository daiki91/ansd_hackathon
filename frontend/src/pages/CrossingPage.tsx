import { useEffect, useMemo, useState } from 'react'
import { api, ApiError } from '@/api/client'
import { useApiData } from '@/hooks/useApiData'
import { PageHeader } from '@/components/PageHeader'
import { StateMessage } from '@/components/StateMessage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/dashboards/DataTable'
import { GitMerge, Sparkles, RefreshCw } from 'lucide-react'
import type { CrossingRunResult, Dataset } from '@/api/types'

const MAX_SELECTION = 4

export function CrossingPage() {
  const { data: datasets } = useApiData(() => api.getCatalog(), [])
  const [selected, setSelected] = useState<string[]>([])
  const [explain, setExplain] = useState(false)
  const [result, setResult] = useState<CrossingRunResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const datasetsByDomain = useMemo(() => {
    const map = new Map<string, Dataset[]>()
    for (const d of datasets ?? []) {
      const list = map.get(d.domain) ?? []
      list.push(d)
      map.set(d.domain, list)
    }
    return map
  }, [datasets])

  const toggleDataset = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= MAX_SELECTION) return prev
      return [...prev, id]
    })
  }

  useEffect(() => {
    if (selected.length < 2) {
      setResult(null)
      setError(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    api.runCrossing({ dataset_ids: selected, explain })
      .then((res) => { if (!cancelled) setResult(res) })
      .catch((err: unknown) => {
        if (cancelled) return
        setResult(null)
        setError(err instanceof ApiError ? err.message : 'Le croisement a échoué.')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [selected, explain])

  const primaryIndicator = result?.indicators?.[0] ?? null
  const maxIndicatorValue = primaryIndicator ? Math.max(...primaryIndicator.points.map((p) => p.value)) : 0

  const joinedRows = useMemo((): Array<{ zone: string; values: Record<string, number> }> => {
    if (!result) return []
    return Object.entries(result.joined_table).map(([zone, values]) => ({ zone, values }))
  }, [result])

  return (
    <div className="space-y-6">
      <PageHeader
        icon={GitMerge}
        title="Moteur de croisement"
        subtitle="« Nous ne créons pas une nouvelle base de données. Nous créons une couche intelligente qui permet de connecter les données existantes afin d'en extraire une valeur nouvelle. » — le cœur différenciant de DATA LINK (section 4.2 du cahier des charges)."
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">1. Choisir 2 à {MAX_SELECTION} jeux de données à croiser</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...datasetsByDomain.entries()].map(([domain, list]) => (
            <div key={domain}>
              <p className="text-xs font-semibold text-[var(--color-grey)] uppercase tracking-wide mb-1.5">{domain}</p>
              <div className="flex flex-wrap gap-2">
                {list.map((d) => {
                  const active = selected.includes(d.id)
                  const disabled = !active && selected.length >= MAX_SELECTION
                  return (
                    <button
                      key={d.id}
                      onClick={() => toggleDataset(d.id)}
                      disabled={disabled}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                        active
                          ? 'bg-[var(--color-teal)] border-[var(--color-teal)] text-white'
                          : disabled
                            ? 'border-[#e2e7ee] text-[var(--color-grey)] opacity-40 cursor-not-allowed'
                            : 'border-[#e2e7ee] text-[var(--color-navy)] hover:border-[var(--color-teal)]'
                      }`}
                    >
                      {d.title}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          <label className="flex items-center gap-2 text-sm text-[var(--color-navy)] pt-2">
            <input type="checkbox" checked={explain} onChange={(e) => setExplain(e.target.checked)} className="accent-[var(--color-teal)]" />
            <Sparkles className="h-3.5 w-3.5 text-[var(--color-teal)]" />
            Reformuler l'interprétation avec l'IA (les chiffres restent calculés par le moteur, jamais par l'IA)
          </label>
        </CardContent>
      </Card>

      {selected.length < 2 && (
        <StateMessage kind="empty" message="Sélectionne au moins 2 jeux de données pour lancer un croisement." />
      )}

      {loading && (
        <p className="text-sm text-[var(--color-grey)] flex items-center gap-1.5">
          <RefreshCw className="h-4 w-4 animate-spin" />Croisement en cours…
        </p>
      )}
      {error && <StateMessage kind="error" message={error} />}

      {result && !loading && !error && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                2. Résultat
                <Badge variant="outline" className="text-[10px]">dimension : {result.dimension}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {primaryIndicator && primaryIndicator.points.length > 0 ? (
                <div>
                  <div className="text-sm font-semibold text-[var(--color-navy)] flex items-center gap-2">
                    {primaryIndicator.label} ({primaryIndicator.unit})
                    {primaryIndicator.recipe_slug && (
                      <Badge variant="teal" className="text-[9px]">indicateur reconnu automatiquement</Badge>
                    )}
                  </div>
                  <div className="mt-2 space-y-1">
                    {primaryIndicator.points.slice(0, 14).map((p) => (
                      <div key={p.zone} className="flex items-center gap-2 text-[11px]">
                        <span className="w-28 text-right truncate text-[var(--color-navy)]">{p.zone}</span>
                        <div className="flex-1 h-3 bg-[var(--color-lightbg)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[var(--color-teal)]"
                            style={{ width: `${maxIndicatorValue > 0 ? (p.value / maxIndicatorValue) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="w-24 text-right font-mono font-semibold text-[var(--color-navy)]">
                          {p.value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <StateMessage kind="empty" message="Aucun indicateur calculable (aucune valeur commune entre ces jeux de données)." />
              )}

              <div className="p-2.5 rounded-lg bg-[var(--color-navy)] text-white text-xs leading-relaxed">
                {result.interpretation}
              </div>

              {result.correlations.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {result.correlations.filter((c) => c.r !== null).map((c) => (
                    <Badge key={`${c.dataset_a}-${c.dataset_b}`} variant="secondary" className="text-[10px]">
                      corrélation {c.dataset_a} / {c.dataset_b} : r={c.r?.toFixed(2)} (n={c.n})
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {result.sources.map((src) => (
                  <Badge key={src} variant="outline" className="text-[9px]">{src}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Table croisée détaillée</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                rows={joinedRows}
                rowKey={(row) => row.zone}
                columns={[
                  { key: 'zone', label: result.dimension === 'year' ? 'Année' : 'Zone', render: (r) => r.zone },
                  ...result.datasets.map((d) => ({
                    key: d.dataset_id,
                    label: `${d.label} (${d.unit})`,
                    render: (r: typeof joinedRows[number]) => {
                      const v = r.values[d.dataset_id]
                      return typeof v === 'number' ? v.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) : '—'
                    },
                  })),
                ]}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
