import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useApiData } from '../hooks/useApiData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bot, Database, Users, TrendingUp, HeartPulse, Globe, Map } from 'lucide-react'

const QUICK_LINKS = [
  {
    to: '/assistant',
    title: 'Assistant IA',
    icon: Bot,
    description: 'Posez vos questions en langage naturel sur les données statistiques du Sénégal.',
    color: 'bg-purple-100 text-purple-700',
  },
  {
    to: '/carte',
    title: 'Carte interactive',
    icon: Map,
    description: 'Visualisez les données par région sur une carte interactive du Sénégal.',
    color: 'bg-emerald-100 text-emerald-700',
  },
  {
    to: '/catalogue',
    title: 'Catalogue de données',
    icon: Database,
    description: "Explorez les jeux de données référencés et téléchargez-les (CSV, Excel, JSON).",
    color: 'bg-blue-100 text-blue-700',
  },
  {
    to: '/tableaux-de-bord/population',
    title: 'Population',
    icon: Users,
    description: "Population du Sénégal par région (RGPH-5, 2023).",
    color: 'bg-amber-100 text-amber-700',
  },
  {
    to: '/tableaux-de-bord/economie',
    title: 'Économie',
    icon: TrendingUp,
    description: 'Croissance du PIB, inflation et dette publique.',
    color: 'bg-rose-100 text-rose-700',
  },
  {
    to: '/tableaux-de-bord/sante',
    title: 'Santé',
    icon: HeartPulse,
    description: 'Établissements de santé par type et par région.',
    color: 'bg-teal-100 text-teal-700',
  },
  {
    to: '/tableaux-de-bord/commerce',
    title: 'Commerce extérieur',
    icon: Globe,
    description: 'Exportations et importations par pays partenaire.',
    color: 'bg-indigo-100 text-indigo-700',
  },
]

export function HomePage() {
  const { data: datasets } = useApiData(() => api.getCatalog(), [])

  return (
    <div className="space-y-8">
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold text-[var(--color-navy)] mb-3">DATA LINK</h1>
        <p className="text-lg text-[var(--color-teal)] italic mb-4">
          « Connecter les données pour révéler l'information. »
        </p>
        <div className="max-w-2xl mx-auto text-[var(--color-grey)]">
          Plateforme intelligente de visualisation, d'analyse, de croisement et de valorisation des données
          statistiques du Sénégal, basée sur les jeux de données ouvertes de l'ANSD.
          {datasets && (
            <Badge variant="secondary" className="ml-2">
              {datasets.length} jeux de données
            </Badge>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-[var(--color-navy)] mb-6">Explorer la plateforme</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {QUICK_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="no-underline group">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${link.color}`}>
                      <link.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{link.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[var(--color-grey)]">{link.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
