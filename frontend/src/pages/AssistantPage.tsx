import { ChatBot } from '../components/ChatBot'
import './pages.css'

export function AssistantPage() {
  return (
    <div className="page-header">
      <h1>Assistant IA</h1>
      <p>
        Posez vos questions sur les données statistiques du Sénégal.
        L'assistant utilise la technologie RAG pour rechercher dans les documents
        ingérés et fournir des réponses précises et sourcées.
      </p>

      <div style={{ marginTop: '1.5rem', height: 'calc(100vh - 220px)', minHeight: '500px' }}>
        <ChatBot embedded />
      </div>
    </div>
  )
}
