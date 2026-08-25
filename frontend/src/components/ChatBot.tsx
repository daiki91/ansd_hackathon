import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Send, Paperclip, BarChart3, Bot, FileText } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
  chunksUsed?: number
}

const SUGGESTIONS = [
  "Quelle est la population du Sénégal ?",
  "Quels sont les principaux partenaires commerciaux ?",
  "Combien d'établissements de santé y a-t-il ?",
  "Quel est le taux de croissance du PIB ?",
  "Compare la santé entre Dakar et Thiès",
]

export function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Bonjour ! Je suis **DATA LINK Assistant**, votre expert en données statistiques du Sénégal.\n\nJe peux vous aider à :\n- Comprendre les indicateurs économiques et démographiques\n- Comparer les données entre régions\n- Expliquer les statistiques de l'ANSD\n- Analyser les tendances\n\nPosez-moi vos questions ou uploadez un document PDF pour l'analyser !",
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [ragStats, setRagStats] = useState({ total: 0, name: '' })
  const [showUpload, setShowUpload] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/chat/stats`)
      .then((r) => r.json())
      .then((d) => setRagStats({ total: d.total_documents, name: d.collection_name }))
      .catch(() => {})
  }, [])

  const autoResize = () => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    }
  }

  const sendMessage = async (overrideInput?: string) => {
    const text = overrideInput || input
    if (!text.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    try {
      const history = messages
        .filter((m) => m.content.trim() !== '')
        .map((m) => ({ role: m.role, content: m.content }))

      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiBase}/api/v1/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, conversation_history: history }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => null)
        throw new Error(err?.detail || 'Erreur serveur')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue
              assistantContent += data
              setMessages((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: assistantContent,
                }
                return updated
              })
            }
          }
        }
      }

      fetch(`${apiBase}/api/v1/chat/stats`)
        .then((r) => r.json())
        .then((d) => setRagStats({ total: d.total_documents, name: d.collection_name }))
        .catch(() => {})
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Erreur inconnue'
      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (last?.role === 'assistant' && last.content === '') {
          return [
            ...prev.slice(0, -1),
            {
              role: 'assistant',
              content: `**Erreur :** ${errorMsg}\n\nVérifiez que :\n- Le serveur backend tourne sur le port 8000\n- La clé \`ANTHROPIC_API_KEY\` est configurée dans \`backend/.env\`\n- Des documents ont été ingérés dans la base vectorielle`,
            },
          ]
        }
        return [
          ...prev,
          {
            role: 'assistant',
            content: `**Erreur :** ${errorMsg}`,
          },
        ]
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Seuls les fichiers PDF sont acceptés.')
      return
    }

    setIsUploading(true)
    setShowUpload(false)

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: `📄 Upload du fichier : **${file.name}**` },
    ])

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const formData = new FormData()
      formData.append('file', file)
      formData.append('source_name', file.name)

      const response = await fetch(`${apiBase}/api/v1/chat/ingest/pdf`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const err = await response.json().catch(() => null)
        throw new Error(err?.detail || "Erreur lors de l'upload")
      }

      const result = await response.json()

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `✅ Document **${result.source}** ingéré avec succès !\n\n- **${result.chunks_ingested}** morceaux indexés\n- **${result.total_text_length.toLocaleString()}** caractères extraits\n\nVous pouvez maintenant poser des questions sur le contenu de ce document.`,
        },
      ])

      setRagStats((prev) => ({
        ...prev,
        total: prev.total + result.chunks_ingested,
      }))
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erreur d'upload"
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `**Erreur upload :** ${errorMsg}`,
        },
      ])
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
    e.target.value = ''
  }

  const renderMarkdown = (text: string) => {
    return text
      .split('\n')
      .map((line, i) => {
        let processed = line
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/`([^`]+)`/g, '<code>$1</code>')
        return (
          <span key={i}>
            <span dangerouslySetInnerHTML={{ __html: processed }} />
            {i < text.split('\n').length - 1 && <br />}
          </span>
        )
      })
  }

  const chatContent = (
    <div className="flex flex-col h-full bg-white rounded-xl border shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-navy)] text-white rounded-t-xl">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <div>
            <span className="font-semibold text-sm">DATA LINK Assistant</span>
            <div className="flex items-center gap-2 text-xs text-white/70">
              <span>RAG powered by Claude</span>
              {ragStats.total > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {ragStats.total} docs
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-teal)] flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
              msg.role === 'user'
                ? 'bg-[var(--color-navy)] text-white'
                : 'bg-[var(--color-lightbg)] text-[var(--color-navy)]'
            }`}>
              {renderMarkdown(msg.content)}
            </div>
          </div>
        ))}
        {(isLoading || isUploading) && (
          <div className="flex gap-2">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-teal)] flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-[var(--color-lightbg)] rounded-lg px-3 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-[var(--color-grey)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-[var(--color-grey)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-[var(--color-grey)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-[var(--color-grey)] mb-2">Questions suggérées :</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((q, i) => (
              <button
                key={i}
                className="text-xs px-2 py-1 rounded-full border border-[var(--color-teal)] text-[var(--color-teal)] hover:bg-[var(--color-teal)] hover:text-white transition-colors cursor-pointer"
                onClick={() => sendMessage(q)}
                disabled={isLoading}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-t">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setShowUpload(!showUpload)}
          title="Uploader un PDF"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={async () => {
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000'
            try {
              const r = await fetch(`${apiBase}/api/v1/chat/stats`)
              const d = await r.json()
              setMessages((prev) => [
                ...prev,
                {
                  role: 'assistant',
                  content: `📊 **État de la base de connaissances :**\n\n- **${d.total_documents}** morceaux de texte indexés\n- Collection : \`${d.collection_name}\`\n\n${d.total_documents === 0 ? '⚠️ Aucun document ingéré. Uploadez un PDF pour commencer !' : '✅ Base prête pour répondre à vos questions.'}`,
                },
              ])
            } catch {
              setMessages((prev) => [
                ...prev,
                {
                  role: 'assistant',
                  content: "❌ Impossible de récupérer les stats. Le serveur est-il lancé ?",
                },
              ])
            }
          }}
          title="Stats base de données"
        >
          <BarChart3 className="h-4 w-4" />
        </Button>
      </div>

      {/* Upload panel */}
      {showUpload && (
        <div className="px-4 py-3 border-t bg-[var(--color-lightbg)]">
          <p className="text-xs text-[var(--color-grey)] mb-2">Choisissez un document PDF :</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full"
          >
            <FileText className="mr-2 h-4 w-4" />
            {isUploading ? 'Upload en cours...' : 'Sélectionner un PDF'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      )}

      {/* Input */}
      <div className="flex items-end gap-2 p-4 border-t">
        <textarea
          ref={textareaRef}
          className="flex-1 resize-none rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)] min-h-[40px] max-h-[120px]"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            autoResize()
          }}
          onKeyDown={handleKeyDown}
          placeholder="Posez votre question..."
          rows={1}
          disabled={isLoading || isUploading}
        />
        <Button
          size="icon"
          className="h-10 w-10 flex-shrink-0"
          onClick={() => sendMessage()}
          disabled={isLoading || isUploading || !input.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  return chatContent
}
