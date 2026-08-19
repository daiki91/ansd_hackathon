import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { CatalogPage } from './pages/CatalogPage'
import { HealthDashboardPage } from './pages/HealthDashboardPage'
import { TradeDashboardPage } from './pages/TradeDashboardPage'
import { PopulationDashboardPage } from './pages/PopulationDashboardPage'
import { EconomyDashboardPage } from './pages/EconomyDashboardPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="catalogue" element={<CatalogPage />} />
        <Route path="tableaux-de-bord/population" element={<PopulationDashboardPage />} />
        <Route path="tableaux-de-bord/economie" element={<EconomyDashboardPage />} />
        <Route path="tableaux-de-bord/sante" element={<HealthDashboardPage />} />
        <Route path="tableaux-de-bord/commerce" element={<TradeDashboardPage />} />
      </Route>
    </Routes>
  )
}

export default App
