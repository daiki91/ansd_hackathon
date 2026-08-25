import { ChatBot } from '../components/ChatBot'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot } from 'lucide-react'

export function AssistantPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-[var(--color-teal)]" />
            Assistant IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--color-grey)] mb-6">
            Posez vos questions sur les données statistiques du Sénégal.
            L'assistant utilise la technologie RAG pour rechercher dans les documents
            ingérés et fournir des réponses précises et sourcées.
          </p>
          <div className="h-[calc(100vh-300px)] min-h-[400px] max-h-[700px]">
            <ChatBot />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
