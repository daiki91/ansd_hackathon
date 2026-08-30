import { useNavigate, useParams } from 'react-router-dom'
import { LayoutDashboard, Users, TrendingUp, HeartPulse, Globe, Wheat } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PopulationPanel } from '@/components/dashboards/PopulationPanel'
import { HealthPanel } from '@/components/dashboards/HealthPanel'
import { EconomyPanel } from '@/components/dashboards/EconomyPanel'
import { TradePanel } from '@/components/dashboards/TradePanel'
import { AgriculturePanel } from '@/components/dashboards/AgriculturePanel'

const DOMAINS = [
  { slug: 'population', label: 'Population', icon: Users, description: "Population résidente par région (RGPH-5, 2023).", Panel: PopulationPanel },
  { slug: 'sante', label: 'Santé', icon: HeartPulse, description: 'Établissements de santé par type et par région.', Panel: HealthPanel },
  { slug: 'economie', label: 'Économie', icon: TrendingUp, description: 'Croissance du PIB, inflation et dette publique.', Panel: EconomyPanel },
  { slug: 'commerce', label: 'Commerce', icon: Globe, description: 'Exportations et importations par pays partenaire.', Panel: TradePanel },
  { slug: 'agriculture', label: 'Agriculture', icon: Wheat, description: 'Production et importations de céréales.', Panel: AgriculturePanel },
] as const

const DEFAULT_DOMAIN = DOMAINS[0].slug

export function DashboardsPage() {
  const { domain } = useParams<{ domain: string }>()
  const navigate = useNavigate()
  const current = DOMAINS.find((d) => d.slug === domain) ?? DOMAINS[0]

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title="Tableaux de bord"
        subtitle="Indicateurs clés par domaine, actualisés à chaque mise à jour des données sources (RF-02)."
      />

      <Tabs value={current.slug} onValueChange={(value) => navigate(`/tableaux-de-bord/${value}`)}>
        <TabsList>
          {DOMAINS.map((d) => (
            <TabsTrigger key={d.slug} value={d.slug} className="gap-1.5">
              <d.icon className="h-4 w-4" />
              {d.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <p className="text-sm text-[var(--color-grey)] -mt-2">{current.description}</p>

      <current.Panel />
    </div>
  )
}

export { DEFAULT_DOMAIN }
