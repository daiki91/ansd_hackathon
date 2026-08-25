import { useState, useRef, useEffect, useCallback } from 'react'
import './ChatBot.css'

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

interface ChatBotProps {
  embedded?: boolean
}

export function ChatBot({ embedded = false }: ChatBotProps) {
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
  const [isOpen, setIsOpen] = useState(false)
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

      // Update RAG stats after response
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

      // Update stats
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
    // Simple markdown: bold, code, line breaks
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
    <div className={`chatbot ${embedded ? 'chatbot--embedded' : ''}`}>
      <div className="chatbot__header">
        <div className="chatbot__header-info">
          <span className="chatbot__title">DATA LINK Assistant</span>
          <span className="chatbot__subtitle">
            RAG powered by Claude
            {ragStats.total > 0 && (
              <span className="chatbot__stats-badge">
                {ragStats.total} documents
              </span>
            )}
          </span>
        </div>
        {!embedded && (
          <button
            className="chatbot__close"
            onClick={() => setIsOpen(false)}
            aria-label="Fermer"
          >
            ✕
          </button>
        )}
      </div>

      <div className="chatbot__messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chatbot__message chatbot__message--${msg.role}`}>
            {msg.role === 'assistant' && (
              <div className="chatbot__avatar">🤖</div>
            )}
            <div className="chatbot__message-body">
              <div className="chatbot__message-content">
                {renderMarkdown(msg.content)}
              </div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="chatbot__sources">
                  📎 Sources : {msg.sources.join(', ')}
                </div>
              )}
            </div>
          </div>
        ))}
        {(isLoading || isUploading) && (
          <div className="chatbot__message chatbot__message--assistant">
            <div className="chatbot__avatar">🤖</div>
            <div className="chatbot__message-body">
              <div className="chatbot__message-content chatbot__typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length <= 1 && (
        <div className="chatbot__suggestions">
          <p className="chatbot__suggestions-title">Questions suggérées :</p>
          <div className="chatbot__suggestions-list">
            {SUGGESTIONS.map((q, i) => (
              <button
                key={i}
                className="chatbot__suggestion-chip"
                onClick={() => sendMessage(q)}
                disabled={isLoading}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="chatbot__toolbar">
        <button
          className="chatbot__tool-btn"
          onClick={() => setShowUpload(!showUpload)}
          title="Uploader un PDF"
        >
          📎
        </button>
        <button
          className="chatbot__tool-btn"
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
          📊
        </button>
      </div>

      {showUpload && (
        <div className="chatbot__upload-panel">
          <p>Choisissez un document PDF à ingérer :</p>
          <button
            className="chatbot__upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? '⏳ Upload en cours...' : '📁 Sélectionner un PDF'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
        </div>
      )}

      <div className="chatbot__input-area">
        <textarea
          ref={textareaRef}
          className="chatbot__input"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            autoResize()
          }}
          onKeyDown={handleKeyDown}
          placeholder="Posez votre question sur les données du Sénégal..."
          rows={1}
          disabled={isLoading || isUploading}
        />
        <button
          className="chatbot__send"
          onClick={() => sendMessage()}
          disabled={isLoading || isUploading || !input.trim()}
          aria-label="Envoyer"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  )

  // Embedded mode: render chat directly (for the /assistant page)
  if (embedded) return chatContent

  // Floating bubble mode
  return (
    <>
      <button
        className="chatbot-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Ouvrir l'assistant IA"
      >
        {isOpen ? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </button>

      {isOpen && chatContent}
    </>
  )
}
