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
  Region,
  Department,
  DataSource,
  TradeFlow,
  TradeFlowType,
  RegionalGdp,
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

export interface DataFreshness {
  freshness: Record<string, {
    source: string
    url: string
    fetched_at: string
    rows: number
    status: 'live' | 'local_cache' | 'error'
  }>
  last_refresh: string | null
}

export interface RefreshResult {
  summary: Record<string, { source: string; rows: number; status: string }>
  freshness: DataFreshness['freshness']
  timestamp: string
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
  getProjections: (filters?: { region?: string; year?: number; level?: string }) =>
    apiGet<{ projections: { region?: string; departement?: string; year: number; population: number }[]; source: string; base_year: number; level?: string }>(
      '/api/v1/population/projections', filters
    ),
  getRegionalGdp: (filters?: { region?: string; year?: number }) =>
    apiGet<RegionalGdp[]>('/api/v1/regional-gdp', filters),
  getIndicators: (filters?: { category?: string; indicator?: string; year?: number }) =>
    apiGet<Indicator[]>('/api/v1/indicators', filters),
  getRegions: () => apiGet<{ regions: Region[]; count: number }>('/api/v1/geo/regions'),
  getDepartments: (region?: string) =>
    apiGet<{ departments: Department[]; count: number }>('/api/v1/geo/departments', { region }),
  getDataSources: () => apiGet<{ sources: DataSource[]; count: number }>('/api/v1/geo/sources'),
  refreshData: () => apiGet<RefreshResult>('/api/v1/data/refresh'),
  getFreshness: () => apiGet<DataFreshness>('/api/v1/data/freshness'),
}

export { ApiError }
