import { datasetDownloadUrl, api } from '../api/client'
import { useApiData } from '../hooks/useApiData'
import { StateMessage } from '../components/StateMessage'
import type { ExportFormat } from '../api/types'
import './pages.css'

const FORMATS: { format: ExportFormat; label: string }[] = [
  { format: 'csv', label: 'CSV' },
  { format: 'excel', label: 'Excel' },
  { format: 'json', label: 'JSON' },
]

export function CatalogPage() {
  const { data: datasets, loading, error } = useApiData(() => api.getCatalog(), [])

  return (
    <div>
      <div className="page-header">
        <h1>Catalogue de données</h1>
        <p>
          Jeux de données statistiques référencés sur DATA LINK, avec leurs métadonnées (source, période
          couverte, niveau géographique, variables disponibles) et leur téléchargement en Open Data.
        </p>
      </div>

      {loading ? <StateMessage kind="loading" message="Chargement du catalogue…" /> : null}
      {error ? <StateMessage kind="error" message={error} /> : null}
      {!loading && !error && datasets?.length === 0 ? (
        <StateMessage kind="empty" message="Aucun jeu de données n'est encore référencé." />
      ) : null}

      {datasets?.map((dataset) => (
        <article key={dataset.id} className="dataset-card">
          <div className="dataset-card__header">
            <h3>{dataset.title}</h3>
            <span className="dataset-card__domain">{dataset.domain}</span>
          </div>
          <p className="dataset-card__description">{dataset.description}</p>

          <div className="dataset-card__meta">
            <div>
              <strong>Source : </strong>
              <a href={dataset.source_url} target="_blank" rel="noreferrer">
                {dataset.source_name}
              </a>
            </div>
            <div>
              <strong>Période couverte : </strong>
              {dataset.period_covered || 'Non précisée'}
            </div>
            <div>
              <strong>Niveau géographique : </strong>
              {dataset.geographic_level || 'Non précisé'}
            </div>
          </div>

          {dataset.variables.length > 0 ? (
            <div className="tag-list">
              {dataset.variables.map((variable) => (
                <span key={variable} className="tag">
                  {variable}
                </span>
              ))}
            </div>
          ) : null}

          <div className="download-buttons">
            {FORMATS.map(({ format, label }) => (
              <a key={format} href={datasetDownloadUrl(dataset.id, format)}>
                Télécharger ({label})
              </a>
            ))}
          </div>
        </article>
      ))}
    </div>
  )
}
