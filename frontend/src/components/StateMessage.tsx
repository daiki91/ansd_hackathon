import './StateMessage.css'

interface StateMessageProps {
  kind: 'loading' | 'error' | 'empty'
  message: string
}

/** Affiche un état de chargement, d'erreur ou "aucune donnée" de façon uniforme. */
export function StateMessage({ kind, message }: StateMessageProps) {
  return <div className={`state-message state-message--${kind}`}>{message}</div>
}
