import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { CatalogPage } from './pages/CatalogPage'
import { DashboardsPage } from './pages/DashboardsPage'
import { CrossingPage } from './pages/CrossingPage'
import { AssistantPage } from './pages/AssistantPage'
import MapPage from './pages/MapPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="catalogue" element={<CatalogPage />} />
        <Route path="carte" element={<MapPage />} />
        <Route path="tableaux-de-bord" element={<Navigate to="/tableaux-de-bord/population" replace />} />
        <Route path="tableaux-de-bord/:domain" element={<DashboardsPage />} />
        <Route path="croisement" element={<CrossingPage />} />
        <Route path="assistant" element={<AssistantPage />} />
      </Route>
    </Routes>
  )
}

export default App
