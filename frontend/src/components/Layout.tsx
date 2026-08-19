import { NavLink, Outlet } from 'react-router-dom'
import './Layout.css'

const NAV_LINKS = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/catalogue', label: 'Catalogue de données' },
  { to: '/tableaux-de-bord/population', label: 'Population' },
  { to: '/tableaux-de-bord/economie', label: 'Économie' },
  { to: '/tableaux-de-bord/sante', label: 'Santé' },
  { to: '/tableaux-de-bord/commerce', label: 'Commerce extérieur' },
]

export function Layout() {
  return (
    <div className="layout">
      <header className="layout__header">
        <div className="layout__header-inner">
          <NavLink to="/" className="layout__brand">
            <span className="layout__brand-mark">DATA LINK</span>
            <span className="layout__brand-tagline">Données statistiques du Sénégal</span>
          </NavLink>
          <nav className="layout__nav">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => 'layout__nav-link' + (isActive ? ' layout__nav-link--active' : '')}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="layout__main">
        <Outlet />
      </main>

      <footer className="layout__footer">
        <p>
          DATA LINK — Plateforme intelligente de visualisation, d'analyse et de valorisation des données
          statistiques du Sénégal, basée sur les jeux de données ouvertes de l'ANSD.
        </p>
      </footer>
    </div>
  )
}
