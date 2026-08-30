import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useApiData } from '../hooks/useApiData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Bot, Database, Map, LayoutDashboard, GitMerge,
  Users, TrendingUp, HeartPulse, Globe, Wheat, CheckCircle2, Clock,
} from 'lucide-react'

const DASHBOARD_DOMAINS = [
  { to: '/tableaux-de-bord/population', label: 'Population', icon: Users },
  { to: '/tableaux-de-bord/sante', label: 'Santé', icon: HeartPulse },
  { to: '/tableaux-de-bord/economie', label: 'Économie', icon: TrendingUp },
  { to: '/tableaux-de-bord/commerce', label: 'Commerce', icon: Globe },
  { to: '/tableaux-de-bord/agriculture', label: 'Agriculture', icon: Wheat },
]

const DEMO_USE_CASES = [
  {
    title: 'Cas 1 — Santé',
    flow: 'Population + Établissements de santé → Population par établissement → Classement des régions → Carte interactive.',
    available: true,
  },
  {
    title: 'Cas 2 — Agriculture',
    flow: 'Production agricole + Importations → Production vs dépendance extérieure → Graphique temporel.',
    available: true,
  },
  {
    title: 'Cas 3 — Éducation',
    flow: 'Population + Établissements scolaires + Effectifs → Pression sur les infrastructures scolaires.',
    available: false,
  },
  {
    title: 'Cas 4 — Socio-économique',
    flow: "Éducation + Emploi + Population → Analyse de la situation professionnelle selon le niveau d'instruction.",
    available: false,
  },
]

export function HomePage() {
  const { data: datasets } = useApiData(() => api.getCatalog(), [])

  return (
    <div className="space-y-10">
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold text-[var(--color-navy)] mb-3">DATA LINK</h1>
        <p className="text-lg text-[var(--color-teal)] italic mb-4">
          « Connecter les données pour révéler l'information. »
        </p>
        <div className="max-w-2xl mx-auto text-[var(--color-grey)]">
          DATA LINK n'est ni un simple tableau de bord, ni un moteur de recherche, ni un chatbot isolé : c'est une
          couche intelligente de croisement et de valorisation des données statistiques du Sénégal, basée sur les
          jeux de données ouvertes de l'ANSD.
          {datasets && (
            <Badge variant="secondary" className="ml-2">
              {datasets.length} jeux de données
            </Badge>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-[var(--color-navy)] mb-6">Explorer la plateforme</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Link to="/croisement" className="no-underline group lg:col-span-3">
            <Card className="h-full border-2 border-[var(--color-teal)] transition-shadow hover:shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--color-teal)]/10 text-[var(--color-teal)]">
                    <GitMerge className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Moteur de croisement</CardTitle>
                  <Badge variant="teal" className="text-[10px]">cœur du projet</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--color-grey)]">
                  Sélectionne plusieurs jeux de données : DATA LINK détecte automatiquement leurs dimensions
                  communes, calcule un indicateur nommé (ex. densité de population, PIB par habitant, taux de
                  dépendance aux importations) et en génère une interprétation en langage simple.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/carte" className="no-underline group">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                    <Map className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Carte interactive</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--color-grey)]">Visualisez les données par région sur une carte 3D du Sénégal.</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/catalogue" className="no-underline group">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                    <Database className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Catalogue de données</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--color-grey)]">Explorez les jeux de données référencés et téléchargez-les (CSV, Excel, JSON).</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/assistant" className="no-underline group">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                    <Bot className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Assistant IA</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--color-grey)]">Posez vos questions en langage naturel sur les données statistiques du Sénégal.</p>
              </CardContent>
            </Card>
          </Link>

          <Card className="h-full lg:col-span-3">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Tableaux de bord</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--color-grey)] mb-3">
                Indicateurs clés par domaine, actualisés automatiquement à chaque mise à jour des données sources.
              </p>
              <div className="flex flex-wrap gap-2">
                {DASHBOARD_DOMAINS.map((d) => (
                  <Link key={d.to} to={d.to} className="no-underline">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border border-[#e2e7ee] text-[var(--color-navy)] hover:border-[var(--color-teal)] transition-colors">
                      <d.icon className="h-4 w-4" />
                      {d.label}
                    </span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-[var(--color-navy)] mb-6">
          Cas d'usage de démonstration (section 10 du cahier des charges)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEMO_USE_CASES.map((useCase) => (
            <Card key={useCase.title}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{useCase.title}</CardTitle>
                  {useCase.available ? (
                    <Badge variant="teal" className="text-[10px] gap-1">
                      <CheckCircle2 className="h-3 w-3" />disponible
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <Clock className="h-3 w-3" />à venir
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--color-grey)]">{useCase.flow}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
