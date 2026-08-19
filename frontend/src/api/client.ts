// Client HTTP minimal pour consommer l'API DATA LINK (backend FastAPI).
//
// L'URL de base est configurable via la variable d'environnement Vite
// VITE_API_URL (voir .env.example) ; elle retombe par défaut sur
// http://localhost:8000, l'adresse du backend en développement local.

import type {
  Dataset,
  ExportFormat,
  HealthEstablishment,
  Indicator,
  Population,
  TradeFlow,
  TradeFlowType,
} from './types'

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000'

class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function apiGet<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(`${API_BASE_URL}${path}`)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value))
      }
    }
  }

  let response: Response
  try {
    response = await fetch(url.toString())
  } catch {
    throw new ApiError(
      `Impossible de contacter l'API DATA LINK sur ${API_BASE_URL}. Le backend est-il bien démarré ?`,
      0,
    )
  }

  if (!response.ok) {
    throw new ApiError(`Erreur API (${response.status}) sur ${path}`, response.status)
  }

  return (await response.json()) as T
}

export function datasetDownloadUrl(datasetId: string, format: ExportFormat): string {
  return `${API_BASE_URL}/api/v1/catalog/${datasetId}/download?format=${format}`
}

export const api = {
  getCatalog: (domain?: string) => apiGet<Dataset[]>('/api/v1/catalog', { domain }),
  getDataset: (id: string) => apiGet<Dataset>(`/api/v1/catalog/${id}`),
  getHealthEstablishments: (filters?: { region?: string; facility_type?: string; year?: number }) =>
    apiGet<HealthEstablishment[]>('/api/v1/health-establishments', filters),
  getTradeFlows: (filters?: { flow_type?: TradeFlowType; country?: string; year?: number }) =>
    apiGet<TradeFlow[]>('/api/v1/trade', filters),
  getPopulation: (filters?: { region?: string; year?: number }) =>
    apiGet<Population[]>('/api/v1/population', filters),
  getIndicators: (filters?: { category?: string; indicator?: string; year?: number }) =>
    apiGet<Indicator[]>('/api/v1/indicators', filters),
}

export { ApiError }
