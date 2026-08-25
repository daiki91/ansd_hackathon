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

export interface RegionalGdp {
  id: number
  region: string
  year: number
  pib_volume_mds: number | null
  pib_valeur_mds: number | null
  part_primaire_pct: number | null
  part_secondaire_pct: number | null
  part_tertiaire_pct: number | null
}

export type ExportFormat = 'csv' | 'excel' | 'json'

export interface Region {
  name: string
  center: [number, number]
  code: string
}

export interface Department {
  name: string
  region: string
  center: [number, number]
}

export interface DataSource {
  id: string
  name: string
  full_name: string
  url: string
  description: string
  type: string
  datasets_available: string[]
}

export interface AgricultureProduction {
  id: number
  year: number
  production_nette_tonnes: number
  source: string
}

export interface CerealImports {
  id: number
  year: number
  import_tonnes: number
  source: string
}

export interface RegionArea {
  id: number
  region: string
  area_km2: number
  source: string
}

// ── Moteur de croisement (RF-18 à RF-21) ─────────────────────────────

export interface CrossingRunRequest {
  dataset_ids: string[]
  measures?: Record<string, string>
  dimension?: string
  year?: number
  explain?: boolean
}

export interface CrossingDatasetRef {
  dataset_id: string
  label: string
  measure_column: string
  measure_label: string
  unit: string
  source: string
  year: number | null
}

export interface CrossingIndicatorPoint {
  zone: string
  value: number
}

export interface CrossingIndicator {
  recipe_slug: string | null
  label: string
  unit: string
  numerator_dataset: string
  denominator_dataset: string
  points: CrossingIndicatorPoint[]
}

export interface CrossingPairCorrelation {
  dataset_a: string
  dataset_b: string
  r: number | null
  n: number
}

export interface CrossingRunResult {
  dataset_ids: string[]
  dimension: string
  year: number | null
  datasets: CrossingDatasetRef[]
  joined_table: Record<string, Record<string, number>>
  indicators: CrossingIndicator[]
  correlations: CrossingPairCorrelation[]
  interpretation: string
  sources: string[]
}

export interface CrossingCompatibleEntry {
  dataset_id: string
  label: string
  shared_dimensions: string[]
}

export interface CrossingCompatibleResult {
  dataset_id: string
  compatible: CrossingCompatibleEntry[]
}
