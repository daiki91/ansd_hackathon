import { useState, useMemo, useCallback, useEffect } from 'react'
import Map, { Source, Layer, NavigationControl, useMap } from 'react-map-gl/maplibre'
import { api, API_BASE_URL } from '@/api/client'
import { useApiData } from '@/hooks/useApiData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Layers, BarChart3, RotateCcw,
  MapPin, Users, HeartPulse, TrendingUp, Globe, Building2, Database, ExternalLink, RefreshCw, Info, Banknote,
  Route, TrainFront, Ship, Plane,
} from 'lucide-react'
import type { Region, Department, DataSource } from '@/api/types'
import 'maplibre-gl/dist/maplibre-gl.css'

// ── Types ────────────────────────────────────────────────────────────
type DataLayer = 'population' | 'health' | 'indicators' | 'economy' | 'none'
type GeoLevel = 'regions' | 'departments'
type ViewMode = '2d' | '3d'
type Tab = 'map' | 'sources'

// ── Name normalization ───────────────────────────────────────────────
function normalize(s: string): string {
  return s
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ── Colors ───────────────────────────────────────────────────────────
const PALETTES: Record<DataLayer, [string, string, string, string, string]> = {
  population: ['#d4edda', '#81c784', '#388e3c', '#1b5e20', '#0a3010'],
  health: ['#bbdefb', '#64b5f6', '#1e88e5', '#0d47a1', '#051d40'],
  indicators: ['#ffe0b2', '#ffb74d', '#f57c00', '#e65100', '#4a1800'],
  economy: ['#d1c4e9', '#9575cd', '#673ab7', '#4527a0', '#311b92'],
  none: ['#e8e8e8', '#d0d0d0', '#b0b0b0', '#808080', '#505050'],
}

const SENEGAL_CENTER: [number, number] = [-14.4524, 14.4974]

// ── Projections RGPH-5 ───────────────────────────────────────────────
// Le RGPH-5 (2023) est le dernier recensement. Tant qu'il n'y en a pas de
// nouveau, on se base sur les projections ANSD officielles 2023-2050.
const PROJECTION_YEARS = Array.from({ length: 2050 - 2023 + 1 }, (_, i) => 2023 + i)
const DEFAULT_PROJ_YEAR = Math.min(new Date().getFullYear(), 2050)
const DOMAIN_LABELS: Record<string, string> = { population: 'Population', health: 'Santé', indicators: 'Indicateurs', trade: 'Commerce' }

// ── Fly-to helper ────────────────────────────────────────────────────
function FlyTo({ center, zoom }: { center: [number, number] | null; zoom?: number }) {
  const { current: map } = useMap()
  useEffect(() => {
    if (map && center) {
      map.flyTo({ center, zoom: zoom ?? 7.5, duration: 1200, essential: true })
    }
  }, [map, center, zoom])
  return null
}

// ── Bearing/pitch controller ─────────────────────────────────────────
function BearingPitch({ pitch, bearing }: { pitch: number; bearing: number }) {
  const { current: map } = useMap()
  useEffect(() => {
    if (!map) return
    const apply = () => {
      map.easeTo({ pitch, bearing, duration: 800 })
    }
    if (map.isStyleLoaded()) {
      apply()
    } else {
      map.once('load', apply)
    }
  }, [map, pitch, bearing])
  return null
}

// ── Transport network ────────────────────────────────────────────────
type TransportKind = 'roads' | 'rails' | 'ports' | 'airports'
const TRANSPORT_FILES: Record<TransportKind, string> = {
  roads: '/geo/transport_roads.geojson',
  rails: '/geo/transport_railways.geojson',
  ports: '/geo/transport_points.geojson',
  airports: '/geo/transport_points.geojson',
}
const TRANSPORT_META: Record<TransportKind, { label: string; color: string; Icon: typeof Route }> = {
  roads: { label: 'Routes', color: '#f59e0b', Icon: Route },
  rails: { label: 'Rails', color: '#e2e8f0', Icon: TrainFront },
  ports: { label: 'Ports', color: '#22d3ee', Icon: Ship },
  airports: { label: 'Aéroports', color: '#e879f9', Icon: Plane },
}

// ── Component ────────────────────────────────────────────────────────
export function SenegalMap() {
  // refreshKey : incrémenté après un refresh temps réel pour re-fetcher toutes les données
  const [refreshKey, setRefreshKey] = useState(0)
  const { data: population } = useApiData(() => api.getPopulation(), [refreshKey])
  const { data: health } = useApiData(() => api.getHealthEstablishments(), [refreshKey])
  const { data: indicators } = useApiData(() => api.getIndicators(), [refreshKey])
  const { data: gdp } = useApiData(() => api.getRegionalGdp(), [refreshKey])

  // Projections démographiques pour l'année choisie (base RGPH-5 2023)
  const [projYear, setProjYear] = useState(DEFAULT_PROJ_YEAR)
  const { data: projections } = useApiData(() => api.getProjections({ year: projYear }), [projYear, refreshKey])
  const { data: deptProjections } = useApiData(
    () => api.getProjections({ year: projYear, level: 'departements' }),
    [projYear, refreshKey],
  )

  // Fraîcheur des données (temps réel vs cache local)
  const [refreshing, setRefreshing] = useState(false)
  const [freshnessView, setFreshnessView] = useState<Record<string, { source: string; status: string }> | null>(null)
  const [freshnessTs, setFreshnessTs] = useState('')

  useEffect(() => {
    api.getFreshness().then((f) => setFreshnessView(f.freshness)).catch(() => {})
  }, [])

  const [regions, setRegions] = useState<Region[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [geoLoading, setGeoLoading] = useState(true)

  const [viewMode, setViewMode] = useState<ViewMode>('3d')
  const [geoLevel, setGeoLevel] = useState<GeoLevel>('regions')
  const [activeLayer, setActiveLayer] = useState<DataLayer>('population')
  const [selectedZones, setSelectedZones] = useState<string[]>([])
  const [hoveredName, setHoveredName] = useState<string | null>(null)
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('map')
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null)

  // Cross-comparison mode
  const [crossMode, setCrossMode] = useState(false)
  const [crossLayers, setCrossLayers] = useState<DataLayer[]>(['population', 'health'])

  // Real GeoJSON loaded from files
  const [regionsGeo, setRegionsGeo] = useState<GeoJSON.FeatureCollection | null>(null)
  const [departmentsGeo, setDepartmentsGeo] = useState<GeoJSON.FeatureCollection | null>(null)

  // Réseau de transport (OSM) — couches activables
  const [transportData, setTransportData] = useState<Partial<Record<TransportKind, GeoJSON.FeatureCollection>>>({})
  const [transportOn, setTransportOn] = useState<Record<TransportKind, boolean>>({
    roads: false, rails: false, ports: false, airports: false,
  })

  useEffect(() => {
    let cancelled = false
    Promise.all(
      Object.values(TRANSPORT_FILES).map((f) => fetch(f).then((r) => r.json()).catch(() => null)),
    ).then(([roads, rails, points]) => {
      if (cancelled) return
      setTransportData({ roads, rails, ports: points, airports: points })
    })
    return () => { cancelled = true }
  }, [])

  const toggleTransport = (k: TransportKind) =>
    setTransportOn((prev) => ({ ...prev, [k]: !prev[k] }))

  // Fetch geo data
  const fetchGeo = useCallback(async () => {
    setGeoLoading(true)
    try {
      const [regRes, deptRes, srcRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/geo/regions`).then((r) => r.json()),
        fetch(`${API_BASE_URL}/api/v1/geo/departments`).then((r) => r.json()),
        fetch(`${API_BASE_URL}/api/v1/geo/sources`).then((r) => r.json()),
      ])
      setRegions(regRes.regions ?? [])
      setDepartments(deptRes.departments ?? [])
      setDataSources(srcRes.sources ?? [])
    } catch (e) {
      console.error('Geo fetch failed:', e)
    } finally {
      setGeoLoading(false)
    }
  }, [])

  // Load real GeoJSON boundaries
  const loadBoundaries = useCallback(async () => {
    try {
      const [regGeo, deptGeo] = await Promise.all([
        fetch('/geo/regions.geojson').then((r) => r.json()),
        fetch('/geo/departments.geojson').then((r) => r.json()),
      ])
      setRegionsGeo(regGeo)
      setDepartmentsGeo(deptGeo)
    } catch (e) {
      console.error('Failed to load boundaries:', e)
    }
  }, [])

  useEffect(() => { fetchGeo(); loadBoundaries() }, [fetchGeo, loadBoundaries])

  // Refresh temps réel : re-fetch sources officielles puis recharge tout le frontend
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await api.refreshData()
      setFreshnessView(res.freshness)
      setFreshnessTs(res.timestamp)
    } catch (e) {
      console.error('Refresh failed:', e)
    } finally {
      setRefreshing(false)
    }
    fetchGeo(); loadBoundaries(); setRefreshKey((k) => k + 1)
  }, [fetchGeo, loadBoundaries])

  // ── Data aggregation ───────────────────────────────────────────────
  // Population : priorité aux projections ANSD pour l'année choisie
  // (RGPH-5 2023 = base ; projections jusqu'au prochain recensement).
  const popByRegion = useMemo(() => {
    if (projections && projections.projections.length > 0) {
      const map: Record<string, number> = {}
      for (const p of projections.projections) if (p.region) map[p.region] = p.population
      return map
    }
    // Fallback table population : année demandée si présente, sinon dernière année dispo par région
    const all = (population ?? []).filter((p) => p.region !== 'National')
    const byYear: Record<string, number> = {}
    for (const p of all) if (p.year === projYear) byYear[p.region] = p.count
    if (Object.keys(byYear).length > 0) return byYear
    const best: Record<string, { year: number; count: number }> = {}
    for (const p of all) {
      const b = best[p.region]
      if (!b || p.year > b.year) best[p.region] = { year: p.year, count: p.count }
    }
    return Object.fromEntries(Object.entries(best).map(([k, v]) => [k, v.count]))
  }, [projections, population, projYear])

  // Population départements : projections ANSD officielles (46 départements),
  // remplace l'ancienne répartition égale par région.
  const popByDept = useMemo(() => {
    const map: Record<string, number> = {}
    if (deptProjections?.projections?.length) {
      for (const p of deptProjections.projections) {
        if (p.departement) map[p.departement] = p.population
      }
      return map
    }
    for (const r of regions) {
      const rPop = popByRegion[r.name] ?? 0
      const depts = departments.filter((d) => d.region === r.name)
      const share = depts.length > 0 ? rPop / depts.length : 0
      for (const d of depts) map[d.name] = share
    }
    return map
  }, [deptProjections, popByRegion, regions, departments])

  // PIB régional : dernière année disponible dans les comptes régionaux ANSD
  const gdpByRegion = useMemo(() => {
    const map: Record<string, number> = {}
    for (const g of gdp ?? []) map[g.region] = g.pib_volume_mds ?? 0
    return map
  }, [gdp])

  const healthByRegion = useMemo(() =>
    (health ?? []).filter((h) => h.region !== 'National')
      .reduce<Record<string, number>>((a, h) => { a[h.region] = (a[h.region] ?? 0) + h.count; return a }, {}),
    [health])

  const healthByDept = useMemo(() => {
    const map: Record<string, number> = {}
    for (const r of regions) {
      const rH = healthByRegion[r.name] ?? 0
      const depts = departments.filter((d) => d.region === r.name)
      const share = depts.length > 0 ? rH / depts.length : 0
      for (const d of depts) map[d.name] = share
    }
    return map
  }, [healthByRegion, regions, departments])

  const indicatorByRegion = useMemo(() => {
    const map: Record<string, number> = {}
    for (const ind of indicators ?? []) map[ind.indicator] = ind.value
    return map
  }, [indicators])

  const getDataForLevel = useCallback((level: GeoLevel, source: DataLayer): Record<string, number> => {
    if (source === 'population') return level === 'regions' ? popByRegion : popByDept
    if (source === 'health') return level === 'regions' ? healthByRegion : healthByDept
    if (source === 'indicators') return indicatorByRegion
    if (source === 'economy') return gdpByRegion
    return {}
  }, [popByRegion, popByDept, healthByRegion, healthByDept, indicatorByRegion, gdpByRegion])

  const activeData = useMemo(() => getDataForLevel(geoLevel, activeLayer), [geoLevel, activeLayer, getDataForLevel])
  const maxValue = useMemo(() => Math.max(...Object.values(activeData), 1), [activeData])

  const formatVal = (v: number) => activeLayer === 'population' || activeLayer === 'economy' ? v.toLocaleString('fr-FR') : Math.round(v).toLocaleString('fr-FR')

  // ── Build GeoJSON from real boundaries + data ──────────────────────
  const mapGeoJSON = useMemo<GeoJSON.FeatureCollection | null>(() => {
    const src = geoLevel === 'regions' ? regionsGeo : departmentsGeo
    if (!src) return null

    return {
      type: 'FeatureCollection',
      features: src.features.map((f: GeoJSON.Feature) => {
        const rawName = (f.properties as any)?.shapeName ?? ''
        const nName = normalize(rawName)
        // Find matching data key by normalized name
        const dataKey = Object.keys(activeData).find((k) => normalize(k) === nName)
        return {
          type: 'Feature' as const,
          properties: {
            name: rawName,
            value: dataKey ? activeData[dataKey] : 0,
          },
          geometry: f.geometry,
        }
      }),
    }
  }, [geoLevel, regionsGeo, departmentsGeo, activeData])

  // Build selection GeoJSON
  const selectionGeoJSON = useMemo<GeoJSON.FeatureCollection | null>(() => {
    const src = geoLevel === 'regions' ? regionsGeo : departmentsGeo
    if (!src || selectedZones.length === 0) return null

    return {
      type: 'FeatureCollection',
      features: src.features.filter((f: GeoJSON.Feature) => {
        const rawName = (f.properties as any)?.shapeName ?? ''
        const nName = normalize(rawName)
        return selectedZones.some((z) => normalize(z) === nName)
      }),
    }
  }, [geoLevel, regionsGeo, departmentsGeo, selectedZones])

  // Build labels GeoJSON (centroids from API centers)
  const labelsGeo = useMemo<GeoJSON.FeatureCollection | null>(() => {
    const src = geoLevel === 'regions' ? regionsGeo : departmentsGeo
    if (!src || activeLayer === 'none') return null

    const apiList = geoLevel === 'regions' ? regions : departments

    return {
      type: 'FeatureCollection',
      features: apiList.map((item) => {
        const dataKey = Object.keys(activeData).find((k) => normalize(k) === normalize(item.name))
        const val = dataKey ? activeData[dataKey] : 0

        return {
          type: 'Feature' as const,
          properties: {
            name: item.name,
            value: formatVal(val),
          },
          geometry: { type: 'Point' as const, coordinates: item.center },
        }
      }),
    }
  }, [geoLevel, activeData, regions, departments])

  const hoveredValue = useMemo(() => {
    if (!hoveredName) return null
    const dataKey = Object.keys(activeData).find((k) => normalize(k) === normalize(hoveredName))
    return dataKey ? activeData[dataKey] : null
  }, [hoveredName, activeData])

  // ── Selection ──────────────────────────────────────────────────────
  const toggleZone = useCallback((name: string) => {
    // Find the canonical name from API data
    const apiList = geoLevel === 'regions' ? regions : departments
    const canonical = apiList.find((i) => normalize(i.name) === normalize(name))?.name ?? name
    setSelectedZones((prev) => {
      if (prev.includes(canonical)) return prev.filter((z) => z !== canonical)
      if (prev.length >= 4) return prev
      return [...prev, canonical]
    })
  }, [geoLevel, regions, departments])

  // ── Cross-comparison: chosen layers for selected zones ──────────────
  const crossStats = useMemo(() => {
    if (!crossMode || selectedZones.length === 0 || crossLayers.length === 0) return null
    const dataMap: Record<DataLayer, Record<string, number>> = {
      population: popByRegion,
      health: healthByRegion,
      indicators: indicatorByRegion,
      economy: gdpByRegion,
      none: {},
    }
    return selectedZones.map((name) => {
      const n = normalize(name)
      const findVal = (data: Record<string, number>) => {
        const key = Object.keys(data).find((k) => normalize(k) === n)
        return key ? data[key] : 0
      }
      const entry: Record<string, string | number> = { name }
      for (const layer of crossLayers) {
        entry[layer] = findVal(dataMap[layer])
      }
      return entry as { name: string } & Partial<Record<DataLayer, number>>
    })
  }, [crossMode, selectedZones, crossLayers, popByRegion, healthByRegion, indicatorByRegion, gdpByRegion])


  // ── Handlers ───────────────────────────────────────────────────────
  const onHover = useCallback((evt: any) => {
    const f = evt.features?.[0]
    if (f) {
      setHoveredName(f.properties.name)
      setMousePos({ x: evt.originalEvent?.clientX ?? 0, y: evt.originalEvent?.clientY ?? 0 })
    } else {
      setHoveredName(null)
      setMousePos(null)
    }
  }, [])

  const onClick = useCallback((evt: any) => {
    const f = evt.features?.[0]
    if (f) {
      toggleZone(f.properties.name)
      const apiList = geoLevel === 'regions' ? regions : departments
      const canonical = apiList.find((i) => normalize(i.name) === normalize(f.properties.name))
      if (canonical) setFlyTarget(canonical.center)
    }
  }, [toggleZone, geoLevel, regions, departments])

  const layerName = activeLayer === 'population' ? 'Population'
    : activeLayer === 'health' ? 'Santé'
    : activeLayer === 'indicators' ? 'Indicateurs'
    : activeLayer === 'economy' ? 'PIB régional' : 'N/A'

  const unitLabel = activeLayer === 'population' ? 'hab.'
    : activeLayer === 'health' ? 'établ.'
    : activeLayer === 'indicators' ? 'valeur'
    : activeLayer === 'economy' ? 'Mds FCFA' : ''

  const layerLabel: Record<string, string> = { population: 'Population', health: 'Santé', indicators: 'Indicateurs', economy: 'PIB' }
  const layerColor: Record<string, string> = { population: 'text-[var(--color-teal)]', health: 'text-red-500', indicators: 'text-blue-500', economy: 'text-purple-500' }
  const layerUnit: Record<string, string> = { population: 'hab.', health: 'établ.', indicators: 'val.', economy: 'Mds' }
  const layerIcon: Record<string, typeof Users> = { population: Users, health: HeartPulse, indicators: TrendingUp, economy: Banknote }

  const toggleCrossLayer = (layer: DataLayer) => {
    setCrossLayers((prev) => {
      if (prev.includes(layer)) return prev.length > 1 ? prev.filter((l) => l !== layer) : prev
      return [...prev, layer]
    })
  }

  const pitch = viewMode === '3d' ? 50 : 0
  const bearing = viewMode === '3d' ? -20 : 0

  return (
    <div className="space-y-3">
      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-[var(--color-lightbg)]">
        {([
          ['map', MapPin, 'Carte interactive'],
          ['sources', Database, 'Sources de données'],
        ] as const).map(([key, Icon, label]) => (
          <Button
            key={key}
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab(key)}
            className={`rounded-b-none border-b-2 transition-colors ${activeTab === key ? 'border-[var(--color-teal)] text-[var(--color-navy)]' : 'border-transparent text-[var(--color-grey)]'}`}
          >
            <Icon className="mr-1.5 h-4 w-4" />{label}
          </Button>
        ))}
      </div>

      {activeTab === 'sources' && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Database className="h-4 w-4" />Sources de données officielles</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dataSources.map((src) => (
                <div key={src.id} className="p-3 rounded-lg border hover:shadow-md transition-all hover:-translate-y-0.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{src.name}</span>
                    <Badge variant={src.type === 'primary' ? 'default' : 'secondary'} className="text-[10px]">{src.type}</Badge>
                  </div>
                  <p className="text-xs text-[var(--color-grey)] mb-1">{src.full_name}</p>
                  <p className="text-xs text-[var(--color-grey)] mb-2">{src.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">{src.datasets_available.map((d) => <Badge key={d} variant="outline" className="text-[9px]">{d}</Badge>)}</div>
                    <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-[var(--color-teal)] hover:text-[var(--color-navy)] transition-colors"><ExternalLink className="h-3.5 w-3.5" /></a>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'map' && (
        <>
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-0.5 bg-white rounded-lg border p-0.5 shadow-sm">
              {([
                ['population', Users, 'Population'],
                ['health', HeartPulse, 'Santé'],
                ['economy', Banknote, 'PIB'],
                ['indicators', TrendingUp, 'Indicateurs'],
                ['none', Globe, 'Aucune'],
              ] as const).map(([key, Icon, label]) => (
                <Button key={key} variant={activeLayer === key ? 'default' : 'ghost'} size="sm" onClick={() => setActiveLayer(key)} className="h-7 text-xs px-2.5">
                  <Icon className="mr-1 h-3 w-3" />{label}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-0.5 bg-white rounded-lg border p-0.5 shadow-sm">
              {([
                ['regions', 'Régions (14)'],
                ['departments', 'Départements (45)'],
              ] as const).map(([key, label]) => (
                <Button key={key} variant={geoLevel === key ? 'default' : 'ghost'} size="sm" onClick={() => { setGeoLevel(key); setSelectedZones([]); setFlyTarget(null) }} className="h-7 text-xs px-2.5">
                  {label}
                </Button>
              ))}
            </div>

            {activeLayer === 'population' && (
              <div className="flex items-center gap-1.5 bg-white rounded-lg border px-2 py-1 shadow-sm" title="RGPH-5 2023 = dernier recensement · autres années = projections officielles ANSD">
                <span className="text-[10px] text-[var(--color-grey)] font-medium">Année</span>
                <select
                  value={projYear}
                  onChange={(e) => setProjYear(Number(e.target.value))}
                  className="h-6 text-xs bg-transparent outline-none cursor-pointer font-medium text-[var(--color-navy)]"
                >
                  {PROJECTION_YEARS.map((y) => (
                    <option key={y} value={y}>{y}{y === 2023 ? ' (RGPH-5)' : ''}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-0.5 bg-white rounded-lg border p-0.5 shadow-sm" title="Réseau de transport (OpenStreetMap)">
              {(Object.keys(TRANSPORT_META) as TransportKind[]).map((k) => {
                const { label, Icon } = TRANSPORT_META[k]
                const on = transportOn[k]
                return (
                  <Button key={k} variant={on ? 'default' : 'ghost'} size="sm" onClick={() => toggleTransport(k)}
                    className={`h-7 text-xs px-2 ${on ? 'bg-[var(--color-teal)] text-white' : ''}`} title={label}>
                    <Icon className={`h-3 w-3 ${on ? 'text-white' : 'text-[var(--color-grey)]'}`} />
                    <span className="ml-1">{label}</span>
                  </Button>
                )
              })}
            </div>

            <div className="flex items-center gap-0.5 bg-white rounded-lg border p-0.5 shadow-sm">
              <Button variant={viewMode === '2d' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('2d')} className="h-7 text-xs px-2.5">
                <Layers className="mr-1 h-3 w-3" />2D
              </Button>
              <Button variant={viewMode === '3d' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('3d')} className="h-7 text-xs px-2.5">
                <Building2 className="mr-1 h-3 w-3" />3D
              </Button>
            </div>

            {selectedZones.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => { setSelectedZones([]); setFlyTarget(null) }} className="h-7 text-xs text-[var(--color-grey)]">
                <RotateCcw className="mr-1 h-3 w-3" />{selectedZones.length} sélectionnée{selectedZones.length > 1 ? 's' : ''}
              </Button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <Button
                variant={crossMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCrossMode(!crossMode)}
                className={`h-7 text-xs ${crossMode ? 'bg-[var(--color-teal)] text-white' : 'text-[var(--color-grey)]'}`}
              >
                <BarChart3 className="mr-1 h-3 w-3" />Comparer
              </Button>
              <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing} className="h-7 text-xs text-[var(--color-grey)]">
                <RefreshCw className={`mr-1 h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Synchro…' : 'Actualiser'}
              </Button>
            </div>
          </div>

          {/* Cross-comparison layer selector */}
          {crossMode && (
            <div className="flex items-center gap-2 px-1 py-1.5 bg-[var(--color-lightbg)] rounded-lg border border-dashed border-[var(--color-teal)]">
              <span className="text-[10px] text-[var(--color-grey)] font-medium ml-1">Indicateurs à croiser :</span>
              {(['population', 'health', 'economy', 'indicators'] as DataLayer[]).map((layer) => {
                const Icon = layerIcon[layer]
                const active = crossLayers.includes(layer)
                return (
                  <button
                    key={layer}
                    onClick={() => toggleCrossLayer(layer)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all border ${
                      active
                        ? 'bg-white border-[var(--color-teal)] text-[var(--color-navy)] shadow-sm'
                        : 'bg-transparent border-transparent text-[var(--color-grey)] hover:bg-white/50'
                    }`}
                  >
                    <Icon className={`h-3 w-3 ${active ? layerColor[layer] : 'opacity-40'}`} />
                    {layerLabel[layer]}
                    {active && <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-[var(--color-teal)]" />}
                  </button>
                )
              })}
              <span className="text-[9px] text-[var(--color-grey)] ml-auto opacity-60">
                {crossLayers.length} sélectionné{crossLayers.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
          <div className="relative rounded-xl overflow-hidden border shadow-md" style={{ height: viewMode === '3d' ? '580px' : '480px' }}>
            <Map
              initialViewState={{ longitude: SENEGAL_CENTER[0], latitude: SENEGAL_CENTER[1], zoom: 6.5, pitch: 50, bearing: -20 }}
              style={{ width: '100%', height: '100%' }}
              mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
              interactiveLayerIds={['zones-fill']}
              onMouseMove={onHover}
              onMouseLeave={() => { setHoveredName(null); setMousePos(null) }}
              onClick={onClick}
              cursor={hoveredName ? 'pointer' : 'grab'}
            >
              <NavigationControl position="top-right" visualizePitch />
              <FlyTo center={flyTarget} />
              <BearingPitch pitch={pitch} bearing={bearing} />

              {mapGeoJSON && (
                <Source id="zones" type="geojson" data={mapGeoJSON}>
                  {/* Main fill — real boundaries */}
                  <Layer
                    id="zones-fill"
                    type="fill-extrusion"
                    paint={{
                      'fill-extrusion-color': [
                        'interpolate', ['linear'], ['get', 'value'],
                        0, PALETTES[activeLayer][0],
                        maxValue * 0.25, PALETTES[activeLayer][1],
                        maxValue * 0.5, PALETTES[activeLayer][2],
                        maxValue * 0.75, PALETTES[activeLayer][3],
                        maxValue, PALETTES[activeLayer][4],
                      ],
                      'fill-extrusion-opacity': 0.8,
                      'fill-extrusion-height': viewMode === '3d'
                        ? ['interpolate', ['linear'], ['get', 'value'], 0, 500, maxValue, 22000]
                        : 0,
                      'fill-extrusion-base': 0,
                    }}
                  />
                  {/* Borders — gap effect on dark basemap */}
                  <Layer id="zones-border" type="line" paint={{
                    'line-color': [
                      'case',
                      ['==', ['get', 'name'], hoveredName ?? ''],
                      '#ffffff',
                      'rgba(15,23,42,0.9)',
                    ],
                    'line-width': [
                      'case',
                      ['==', ['get', 'name'], hoveredName ?? ''],
                      2.5,
                      1.2,
                    ],
                  }} />
                </Source>
              )}

              {/* Selected zones highlight */}
              {selectionGeoJSON && (
                <Source id="selected" type="geojson" data={selectionGeoJSON}>
                  <Layer id="selected-ring" type="line" paint={{
                    'line-color': '#fbbf24',
                    'line-width': 3,
                    'line-opacity': 0.9,
                    'line-dasharray': [3, 1],
                  }} />
                </Source>
              )}

              {/* ── Réseau de transport (OSM) ── */}
              {transportOn.roads && transportData.roads && (
                <Source id="t-roads" type="geojson" data={transportData.roads}>
                  <Layer id="t-roads-line" type="line" paint={{
                    'line-color': ['match', ['get', 'kind'],
                      'motorway', '#f59e0b',
                      'trunk', '#fb923c',
                      '#fdba74'],
                    'line-width': ['match', ['get', 'kind'], 'motorway', 2.6, 'trunk', 1.9, 1.3],
                    'line-opacity': 0.85,
                  }} layout={{ 'line-cap': 'round' }} />
                </Source>
              )}
              {transportOn.rails && transportData.rails && (
                <Source id="t-rails" type="geojson" data={transportData.rails}>
                  <Layer id="t-rails-line" type="line" paint={{
                    'line-color': '#e2e8f0',
                    'line-width': 1.8,
                    'line-dasharray': [3, 2],
                    'line-opacity': 0.95,
                  }} />
                </Source>
              )}
              {(transportOn.ports || transportOn.airports) && transportData.ports && (
                <Source id="t-points" type="geojson" data={transportData.ports}>
                  {transportOn.airports && (
                    <Layer id="t-airports-circle" type="circle"
                      filter={['==', ['get', 'kind'], 'airport']}
                      paint={{
                        'circle-color': '#e879f9',
                        'circle-radius': 5,
                        'circle-stroke-color': '#ffffff',
                        'circle-stroke-width': 1.2,
                        'circle-opacity': 0.95,
                      }} />
                  )}
                  {transportOn.ports && (
                    <Layer id="t-ports-circle" type="circle"
                      filter={['==', ['get', 'kind'], 'port']}
                      paint={{
                        'circle-color': '#22d3ee',
                        'circle-radius': 4.5,
                        'circle-stroke-color': '#ffffff',
                        'circle-stroke-width': 1.2,
                        'circle-opacity': 0.95,
                      }} />
                  )}
                  <Layer id="t-points-label" type="symbol" minzoom={7}
                    filter={['in', ['get', 'kind'], ['literal', [...(transportOn.airports ? ['airport'] : []), ...(transportOn.ports ? ['port'] : [])]]]}
                    layout={{
                      'text-field': ['get', 'name'],
                      'text-size': 10,
                      'text-font': ['Open Sans Regular', 'Noto Sans Regular'],
                      'text-offset': [0, 1.3],
                      'text-anchor': 'top',
                      'text-allow-overlap': false,
                    }}
                    paint={{
                      'text-color': '#ffffff',
                      'text-halo-color': 'rgba(0,0,0,0.85)',
                      'text-halo-width': 1.4,
                    }} />
                </Source>
              )}

              {/* Labels */}
              {labelsGeo && (
                <Source id="labels" type="geojson" data={labelsGeo}>
                  <Layer
                    id="labels-symbol"
                    type="symbol"
                    layout={{
                      'text-field': ['concat', ['get', 'name'], '\n', ['get', 'value']],
                      'text-size': 10,
                      'text-font': ['Open Sans Regular', 'Noto Sans Regular'],
                      'text-allow-overlap': true,
                      'text-ignore-placement': true,
                    }}
                    paint={{
                      'text-color': '#ffffff',
                      'text-halo-color': 'rgba(0,0,0,0.8)',
                      'text-halo-width': 1.5,
                    }}
                  />
                </Source>
              )}
            </Map>

            {/* Hover tooltip — follows cursor */}
            {hoveredName && mousePos && (
              <div
                className="fixed z-50 pointer-events-none bg-white rounded-lg shadow-xl border px-3 py-2 text-xs max-w-[220px]"
                style={{ left: mousePos.x + 16, top: mousePos.y - 10 }}
              >
                <p className="font-bold text-[var(--color-navy)]">{hoveredName}</p>
                <p className="text-[var(--color-grey)]">
                  {activeLayer !== 'none' && hoveredValue !== null && (
                    <>{formatVal(hoveredValue)} {unitLabel}</>
                  )}
                  {activeLayer === 'none' && 'Cliquez pour sélectionner'}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {selectedZones.some((z) => normalize(z) === normalize(hoveredName)) ? 'Re-cliquer pour retirer' : 'Cliquez pour sélectionner'}
                </p>
              </div>
            )}

            {/* Legend */}
            {(activeLayer !== 'none' || Object.values(transportOn).some(Boolean)) && (
              <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 text-xs text-white shadow-lg max-w-[210px]">
                {activeLayer !== 'none' && (
                  <>
                    <p className="font-semibold mb-2 flex items-center gap-1.5"><Info className="h-3 w-3 opacity-60" />{layerName}</p>
                    <div className="flex items-center gap-0.5">
                      {PALETTES[activeLayer].map((c, i) => <span key={i} className="w-6 h-2.5 rounded-sm" style={{ background: c }} />)}
                    </div>
                    <div className="flex justify-between mt-1.5 text-[10px] opacity-70">
                      <span>0</span>
                      <span>{maxValue.toLocaleString('fr-FR')} {unitLabel}</span>
                    </div>
                  </>
                )}
                {Object.values(transportOn).some(Boolean) && (
                  <div className={activeLayer !== 'none' ? 'mt-2.5 pt-2 border-t border-white/15' : ''}>
                    {Object.values(transportOn).some(Boolean) && activeLayer === 'none' && (
                      <p className="font-semibold mb-1.5 flex items-center gap-1.5"><Info className="h-3 w-3 opacity-60" />Transport</p>
                    )}
                    <div className="space-y-1">
                      {(Object.keys(TRANSPORT_META) as TransportKind[]).filter((k) => transportOn[k]).map((k) => {
                        const { label, color, Icon } = TRANSPORT_META[k]
                        return (
                          <p key={k} className="flex items-center gap-1.5 text-[10px]">
                            <Icon className="h-3 w-3 shrink-0" />
                            <span className="w-4 h-0.5 rounded-full inline-block" style={{ background: color }} />
                            {label}{k === 'roads' ? ' (A/N)' : ''}
                          </p>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Selected panel */}
            {selectedZones.length > 0 && (
              <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 text-xs text-white shadow-lg max-w-[200px]">
                <p className="font-semibold mb-1.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#fbbf24] animate-pulse" />
                  Sélection ({selectedZones.length}/4)
                </p>
                {selectedZones.map((z) => (
                  <div key={z} className="flex items-center justify-between gap-2 py-0.5 group">
                    <span className="opacity-90">{z}</span>
                    <button onClick={(e) => { e.stopPropagation(); toggleZone(z) }} className="text-red-400 hover:text-red-300 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Loading */}
            {geoLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                <div className="flex items-center gap-2 bg-black/60 text-white px-4 py-2 rounded-lg text-sm">
                  <RefreshCw className="h-4 w-4 animate-spin" />Chargement…
                </div>
              </div>
            )}
          </div>

          {/* Cross-data comparison */}
          {crossStats && crossStats.length > 0 && (
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[var(--color-teal)]" />
                  Comparaison croisée
                </CardTitle>
                <div className="flex flex-wrap gap-1 mt-1">
                  {crossLayers.map((l) => (
                    <Badge key={l} variant="outline" className={`text-[9px] ${layerColor[l]}`}>{layerLabel[l]}</Badge>
                  ))}
                  {crossLayers.length >= 2 && (
                    <Badge variant="teal" className="text-[9px]">× {crossLayers.length} croisés</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Zone cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {crossStats.map((stat) => {
                    // Use first selected layer for bar height
                    const primaryVal = (stat as any)[crossLayers[0]] ?? 0
                    const maxPrimary = Math.max(...crossStats.map((s) => (s as any)[crossLayers[0]] ?? 0))
                    const ratio = maxPrimary > 0 ? primaryVal / maxPrimary : 0
                    return (
                      <div key={stat.name} className="relative p-3 rounded-lg bg-[var(--color-lightbg)] overflow-hidden">
                        <div className="absolute bottom-0 left-0 right-0 opacity-10 rounded-b-lg" style={{ height: `${Math.max(ratio * 100, 8)}%`, background: PALETTES[crossLayers[0]][3] }} />
                        <p className="text-xs font-medium text-[var(--color-navy)] relative">{stat.name}</p>
                        <div className="mt-1 space-y-0.5 relative">
                          {crossLayers.map((layer) => {
                            const val = (stat as any)[layer] ?? 0
                            return (
                              <div key={layer} className="flex items-center justify-between text-[11px]">
                                <span className={layerColor[layer]}>{layerLabel[layer].slice(0, 4)}</span>
                                <span className="font-semibold">
                                  {layer === 'economy' ? val.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) : layer === 'indicators' ? val.toFixed(1) : Math.round(val).toLocaleString('fr-FR')}
                                  <span className="text-[9px] opacity-50 ml-0.5">{layerUnit[layer]}</span>
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Auto-generated insight */}
                {crossStats.length >= 2 && crossLayers.length >= 2 && (
                  <div className="mt-3 p-2.5 rounded-lg bg-[var(--color-navy)] text-white text-xs leading-relaxed">
                    {(() => {
                      const a = crossLayers[0]
                      const b = crossLayers[1]
                      const sortedA = [...crossStats].sort((x, y) => ((y as any)[a] ?? 0) - ((x as any)[a] ?? 0))
                      const sortedB = [...crossStats].sort((x, y) => ((y as any)[b] ?? 0) - ((x as any)[b] ?? 0))
                      const topA = sortedA[0]
                      const topB = sortedB[0]
                      const valA = (topA as any)[a] ?? 0
                      const valB = (topB as any)[b] ?? 0
                      return (
                        <span>
                          <strong>{topA.name}</strong> mène en <span className={layerColor[a]}>{layerLabel[a]}</span> ({formatVal(valA)} {layerUnit[a]}).
                          {' '}<strong>{topB.name}</strong> mène en <span className={layerColor[b]}>{layerLabel[b]}</span> ({formatVal(valB)} {layerUnit[b]}).
                          {topA.name !== topB.name
                            ? <> Les deux leaders sont <strong>différents</strong> — asymétrie à analyser.</>
                            : <> <strong>{topA.name}</strong> domine sur les deux axes.</>
                          }
                        </span>
                      )
                    })()}
                  </div>
                )}

                {/* 2-layer ratio bar */}
                {crossStats.length >= 2 && crossLayers.length === 2 && (
                  <div className="mt-3">
                    <p className="text-[10px] text-[var(--color-grey)] mb-1.5 font-medium">Ratio {layerLabel[crossLayers[0]]} / {layerLabel[crossLayers[1]]} par zone</p>
                    <div className="space-y-1">
                      {crossStats.map((stat) => {
                        const v1 = (stat as any)[crossLayers[0]] ?? 0
                        const v2 = (stat as any)[crossLayers[1]] ?? 1
                        const r = v1 / (v2 || 1)
                        const maxR = Math.max(...crossStats.map((s) => {
                          const sv1 = (s as any)[crossLayers[0]] ?? 0
                          const sv2 = (s as any)[crossLayers[1]] ?? 1
                          return sv1 / (sv2 || 1)
                        }))
                        const barWidth = maxR > 0 ? (r / maxR) * 100 : 0
                        return (
                          <div key={stat.name} className="flex items-center gap-2 text-[11px]">
                            <span className="w-24 text-right truncate text-[var(--color-navy)]">{stat.name}</span>
                            <div className="flex-1 h-3 bg-[var(--color-lightbg)] rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${barWidth}%`, background: PALETTES[crossLayers[0]][2] }} />
                            </div>
                            <span className="w-12 text-right font-mono font-semibold text-[var(--color-navy)]">{r.toFixed(1)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="text-xs text-[var(--color-grey)] flex flex-wrap items-center gap-x-4 gap-y-1 px-1">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />Clic gauche = sélectionner</span>
            <span>Molette = zoom</span>
            <span>Clic droit = rotation</span>
            {Object.entries(freshnessView ?? {}).filter(([k]) => DOMAIN_LABELS[k]).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1" title={v.source}>
                <span className={`w-1.5 h-1.5 rounded-full ${v.status === 'live' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {DOMAIN_LABELS[k]}
              </span>
            ))}
            {freshnessTs && <span className="opacity-60">maj {new Date(freshnessTs).toLocaleTimeString('fr-FR')}</span>}
            <span className="ml-auto opacity-60">Base RGPH-5 (2023) · projections ANSD jusqu'au prochain recensement</span>
          </div>
          {Object.values(transportOn).some(Boolean) && (
            <div className="text-[10px] text-[var(--color-grey)] px-1 opacity-60">
              Réseau de transport © OpenStreetMap contributors (ODbL)
            </div>
          )}
        </>
      )}
    </div>
  )
}
