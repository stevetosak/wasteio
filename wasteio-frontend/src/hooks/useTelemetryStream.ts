// useTelemetryStream.ts
import { useEffect, useRef, useState, useCallback } from 'react'

type StreamStatus = 'idle' | 'connecting' | 'live' | 'retrying' | 'failed'

interface StreamState {
    status: StreamStatus
    attempt: number
    error: string | null
}

export const MAX_RETRIES = 5
const BASE_DELAY_MS = 1_000
const MAX_DELAY_MS = 30_000

function backoffDelay(attempt: number) {
    // Full jitter: random in [0, min(cap, base * 2^attempt)]
    const ceiling = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** attempt)
    return Math.random() * ceiling
}

export function useTelemetryStream(
    url: string,
    onMessage: (data: string) => void,
    enabled = true,
) {
    const [state, setState] = useState<StreamState>({
        status: 'idle',
        attempt: 0,
        error: null,
    })

    const sourceRef = useRef<EventSource | null>(null)
    const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const attemptRef = useRef(0)
    const enabledRef = useRef(false)
    const onMessageRef = useRef<(data: string) => void>(() => {})
    const connectRef = useRef<() => void>(() => {})

    // Sync mutable refs inside effects, never at render time
    useEffect(() => { enabledRef.current = enabled }, [enabled])
    useEffect(() => { onMessageRef.current = onMessage }, [onMessage])

    const clearRetryTimer = () => {
        if (retryTimerRef.current !== null) {
            clearTimeout(retryTimerRef.current)
            retryTimerRef.current = null
        }
    }

    const closeSource = () => {
        sourceRef.current?.close()
        sourceRef.current = null
    }

    // Store connect in a ref so it can call itself recursively
    // without circular useCallback dependency issues
    useEffect(() => {
        connectRef.current = () => {
            closeSource()
            clearRetryTimer()

            setState(s => ({ ...s, status: 'connecting', error: null }))

            const source = new EventSource(url)
            sourceRef.current = source

            source.addEventListener('telemetry', (e: MessageEvent) => {
                onMessageRef.current(e.data)
            })

            source.onopen = () => {
                attemptRef.current = 0
                setState({ status: 'live', attempt: 0, error: null })
            }

            source.onerror = () => {
                source.close()
                sourceRef.current = null

                const nextAttempt = attemptRef.current + 1
                attemptRef.current = nextAttempt

                if (nextAttempt > MAX_RETRIES || !enabledRef.current) {
                    setState({
                        status: 'failed',
                        attempt: nextAttempt,
                        error: 'Could not connect to telemetry stream.',
                    })
                    return
                }

                setState({ status: 'retrying', attempt: nextAttempt, error: null })

                retryTimerRef.current = setTimeout(() => {
                    if (enabledRef.current) connectRef.current()
                }, backoffDelay(nextAttempt))
            }
        }
    }, [url])

    const retry = useCallback(() => {
        attemptRef.current = 0
        connectRef.current()
    }, [])

    useEffect(() => {
        if (!enabled) return
        connectRef.current()
        return () => {
            closeSource()
            clearRetryTimer()
            setState({ status: 'idle', attempt: 0, error: null })
        }
    }, [enabled, url])

    return { ...state, retry }
}