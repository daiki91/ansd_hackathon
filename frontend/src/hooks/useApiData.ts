import { useEffect, useState } from 'react'
import { ApiError } from '../api/client'

interface ApiDataState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * Charge des données depuis l'API et expose un état {data, loading, error}.
 * `deps` fonctionne comme le tableau de dépendances de useEffect : le fetch
 * est relancé lorsqu'une des dépendances change (ex. un filtre région).
 */
export function useApiData<T>(fetcher: () => Promise<T>, deps: unknown[]): ApiDataState<T> {
  const [state, setState] = useState<ApiDataState<T>>({ data: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    setState((prev) => ({ ...prev, loading: true, error: null }))

    fetcher()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof ApiError ? err.message : "Une erreur inattendue s'est produite."
        setState({ data: null, loading: false, error: message })
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
