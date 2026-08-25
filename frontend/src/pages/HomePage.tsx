import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useApiData } from '../hooks/useApiData'
import './pages.css'

const QUICK_LINKS = [
  {
    to: '/assistant',
    title: '🤖 Assistant IA',
    description: 'Posez vos questions en langage naturel sur les données statistiques du Sénégal. Upload de PDF supporté.',
  },
  {
    to: '/catalogue',
    title: 'Catalogue de données',
    description: "Explorez les jeux de données référencés, leurs métadonnées et téléchargez-les (CSV, Excel, JSON).",
  },
  {
    to: '/tableaux-de-bord/population',
    title: 'Tableau de bord Population',
    description: "Population du Sénégal par région (RGPH-5, 2023), base de croisement avec les autres domaines.",
  },
  {
    to: '/tableaux-de-bord/economie',
    title: 'Tableau de bord Économie',
    description: 'Croissance du PIB, inflation et dette publique, suivies dans le temps.',
  },
  {
    to: '/tableaux-de-bord/sante',
    title: 'Tableau de bord Santé',
    description: 'Établissements de santé du Sénégal par type et par région.',
  },
  {
    to: '/tableaux-de-bord/commerce',
    title: 'Tableau de bord Commerce extérieur',
    description: 'Exportations et importations du Sénégal par pays partenaire.',
  },
]

export function HomePage() {
  const { data: datasets } = useApiData(() => api.getCatalog(), [])

  return (
    <div>
      <section className="hero">
        <h1>DATA LINK</h1>
        <p className="slogan">« Connecter les données pour révéler l'information. »</p>
        <p className="lead">
          Plateforme intelligente de visualisation, d'analyse, de croisement et de valorisation des données
          statistiques du Sénégal, basée sur les jeux de données ouvertes de l'ANSD (Agence Nationale de la
          Statistique et de la Démographie).
          {datasets ? ` ${datasets.length} jeu(x) de données actuellement référencé(s) dans le catalogue.` : ''}
        </p>
      </section>

      <section className="section">
        <h2>Explorer la plateforme</h2>
        <div className="card-grid">
          {QUICK_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="link-card">
              <h3>{link.title}</h3>
              <p>{link.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
