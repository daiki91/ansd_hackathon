import { NavLink, Outlet } from 'react-router-dom'
import { Home, Database, Map, LayoutDashboard, GitMerge, Bot } from 'lucide-react'

const NAV_LINKS = [
  { to: '/', label: 'Accueil', icon: Home, end: true },
  { to: '/catalogue', label: 'Catalogue', icon: Database },
  { to: '/carte', label: 'Carte', icon: Map },
  { to: '/tableaux-de-bord/population', label: 'Tableaux de bord', icon: LayoutDashboard },
  { to: '/croisement', label: 'Croisement', icon: GitMerge },
  { to: '/assistant', label: 'Assistant IA', icon: Bot },
]

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-lightbg)]">
      <header className="bg-[var(--color-navy)] text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <NavLink to="/" className="flex items-center gap-3 no-underline">
              <span className="text-xl font-bold tracking-tight text-white">DATA LINK</span>
              <span className="hidden sm:inline text-xs text-white/60">Données statistiques du Sénégal</span>
            </NavLink>
            <nav className="flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors no-underline ${
                      isActive
                        ? 'bg-white/15 text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  <link.icon className="h-4 w-4" />
                  <span className="hidden md:inline">{link.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Outlet />
      </main>

      <footer className="bg-[var(--color-navy)] text-white/50 text-xs py-4 text-center">
        DATA LINK — Plateforme intelligente de visualisation, d'analyse et de valorisation des données
        statistiques du Sénégal, basée sur les jeux de données ouvertes de l'ANSD.
      </footer>
    </div>
  )
}
