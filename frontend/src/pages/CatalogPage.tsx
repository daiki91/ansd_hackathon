import { datasetDownloadUrl, api } from '../api/client'
import { useApiData } from '../hooks/useApiData'
import { StateMessage } from '../components/StateMessage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, Database, ExternalLink } from 'lucide-react'
import type { ExportFormat } from '../api/types'

const FORMATS: { format: ExportFormat; label: string }[] = [
  { format: 'csv', label: 'CSV' },
  { format: 'excel', label: 'Excel' },
  { format: 'json', label: 'JSON' },
]

export function CatalogPage() {
  const { data: datasets, loading, error } = useApiData(() => api.getCatalog(), [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-navy)] flex items-center gap-2">
          <Database className="h-8 w-8 text-[var(--color-teal)]" />
          Catalogue de données
        </h1>
        <p className="text-[var(--color-grey)] mt-1">
          Jeux de données statistiques référencés sur DATA LINK, avec leurs métadonnées et leur téléchargement en Open Data.
        </p>
      </div>

      {loading && <StateMessage kind="loading" message="Chargement du catalogue…" />}
      {error && <StateMessage kind="error" message={error} />}
      {!loading && !error && datasets?.length === 0 && (
        <StateMessage kind="empty" message="Aucun jeu de données n'est encore référencé." />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {datasets?.map((dataset) => (
          <Card key={dataset.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg leading-tight">{dataset.title}</CardTitle>
                <Badge variant="secondary">{dataset.domain}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-[var(--color-grey)]">{dataset.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="font-semibold text-[var(--color-navy)]">Source : </span>
                  <a
                    href={dataset.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--color-teal)] hover:underline inline-flex items-center gap-1"
                  >
                    {dataset.source_name}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div>
                  <span className="font-semibold text-[var(--color-navy)]">Période : </span>
                  <span className="text-[var(--color-grey)]">{dataset.period_covered || 'Non précisée'}</span>
                </div>
                <div>
                  <span className="font-semibold text-[var(--color-navy)]">Niveau : </span>
                  <span className="text-[var(--color-grey)]">{dataset.geographic_level || 'Non précisé'}</span>
                </div>
              </div>

              {dataset.variables.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {dataset.variables.map((variable) => (
                    <Badge key={variable} variant="outline" className="text-[10px]">
                      {variable}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                {FORMATS.map(({ format, label }) => (
                  <a key={format} href={datasetDownloadUrl(dataset.id, format)}>
                    <Button variant="outline" size="sm">
                      <Download className="mr-1 h-3 w-3" />
                      {label}
                    </Button>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
