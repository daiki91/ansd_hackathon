import { ChatBot } from '../components/ChatBot'
import { PageHeader } from '../components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Bot } from 'lucide-react'

export function AssistantPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Bot}
        title="Assistant IA"
        subtitle="Posez vos questions sur les données statistiques du Sénégal. L'assistant utilise la technologie RAG pour rechercher dans les documents ingérés et fournir des réponses précises et sourcées."
      />
      <Card>
        <CardContent className="pt-6">
          <div className="h-[calc(100vh-300px)] min-h-[400px] max-h-[700px]">
            <ChatBot />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
