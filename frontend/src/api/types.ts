// Types miroir des schémas Pydantic exposés par le backend
// (voir backend/app/schemas/*.py).

export interface Dataset {
  id: string
  title: string
  description: string
  domain: string
  source_name: string
  source_url: string
  period_covered: string
  geographic_level: string
  variables: string[]
  compatible_dataset_ids: string[]
  retrieved_at: string
}

export interface HealthEstablishment {
  id: number
  region: string
  facility_type: string
  count: number
  year: number
  source: string
}

export type TradeFlowType = 'export' | 'import'

export interface TradeFlow {
  id: number
  year: number
  flow_type: TradeFlowType
  country: string
  share_pct: number | null
  value_fcfa_billions: number | null
  source: string
}

export interface Population {
  id: number
  region: string
  count: number
  share_pct: number | null
  year: number
  source: string
}

export interface Indicator {
  id: number
  category: string
  indicator: string
  value: number
  unit: string
  year: number
  source: string
}

export type ExportFormat = 'csv' | 'excel' | 'json'
