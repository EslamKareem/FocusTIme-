import { useCallback, useEffect, useRef, useState } from 'react'

type TimerStatus = 'idle' | 'running' | 'paused' | 'complete'

interface TimerPayload {
  sites: string[]
  durationMinutes: number
  status: TimerStatus
  endTime: number | null
}

const STORAGE_KEY = 'focus-timer-v1'
const TICK_MS = 1000
const DEFAULT_DURATION = 25

function formatSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function defaultPayload(): TimerPayload {
  return { sites: [], durationMinutes: DEFAULT_DURATION, status: 'idle', endTime: null }
}

function loadPayload(): TimerPayload {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return defaultPayload()
    const parsed = JSON.parse(raw) as unknown
    if (parsed !== null && typeof parsed === 'object') {
      const p = parsed as Partial<TimerPayload>
      const sites = Array.isArray(p.sites) ? p.sites.filter((s): s is string => typeof s === 'string') : []
      const durationMinutes =
        typeof p.durationMinutes === 'number' && p.durationMinutes > 0 ? p.durationMinutes : DEFAULT_DURATION
      const status =
        p.status === 'idle' ||
        p.status === 'running' ||
        p.status === 'paused' ||
        p.status === 'complete'
          ? p.status
          : 'idle'
      return { sites, durationMinutes, status, endTime: typeof p.endTime === 'number' ? p.endTime : null }
    }
  } catch {
    // Malformed stored data — fall back to defaults.
  }
  return defaultPayload()
}

export default function FocusTimer() {
  const [sitesText, setSitesText] = useState(() => loadPayload().sites.join('\n'))
  const [sites, setSites] = useState<string[]>(() => loadPayload().sites)
  const [duration, setDuration] = useState(() => loadPayload().durationMinutes)
  const [status, setStatus] = useState<TimerStatus>(() => {
    const saved = loadPayload()
    if (saved.status === 'running' && saved.endTime && Date.now() >= saved.endTime) {
      return 'complete'
    }
    return saved.status
  })
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = loadPayload()
    if (saved.status === 'running' && saved.endTime) {
      return Math.max(0, Math.ceil((saved.endTime - Date.now()) / 1000))
    }
    return 0
  })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const endTimeRef = useRef<number | null>(null)

  const clearIntervalRef = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const tick = useCallback(() => {
    if (endTimeRef.current === null) {
      clearIntervalRef()
      return
    }
    const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000))
    setTimeLeft(remaining)
    if (remaining === 0) {
      setStatus('complete')
      clearIntervalRef()
      endTimeRef.current = null
    }
  }, [clearIntervalRef])

  // Resume an in-progress countdown. Persisted state is hydrated by the lazy
  // useState initializers above; this effect only owns the interval side-effect.
  useEffect(() => {
    const saved = loadPayload()
    if (saved.status === 'running' && saved.endTime) {
      const remaining = Math.max(0, Math.ceil((saved.endTime - Date.now()) / 1000))
      endTimeRef.current = saved.endTime
      if (remaining > 0) {
        intervalRef.current = setInterval(tick, TICK_MS)
      }
    }
  }, [tick])

  // Persist timer state (best effort). Not written on every tick to avoid
  // hammering localStorage — endTime is only stored while running.
  useEffect(() => {
    try {
      const payload: TimerPayload = {
        sites,
        durationMinutes: duration,
        status,
        endTime: status === 'running' ? endTimeRef.current ?? null : null,
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // Storage unavailable or quota exceeded — persistence is best effort.
    }
  }, [sites, duration, status])

  useEffect(() => () => clearIntervalRef(), [clearIntervalRef])

  const startTimer = useCallback(() => {
    if (duration <= 0 || status === 'running') return
    const seconds = duration * 60
    endTimeRef.current = Date.now() + seconds * 1000
    setTimeLeft(seconds)
    setStatus('running')
    tick()
    intervalRef.current = setInterval(tick, TICK_MS)
  }, [duration, status, tick])

  const pauseTimer = useCallback(() => {
    if (status !== 'running') return
    clearIntervalRef()
    endTimeRef.current = null
    setStatus('paused')
  }, [status, clearIntervalRef])

  const resumeTimer = useCallback(() => {
    if (status !== 'paused' || timeLeft <= 0) return
    endTimeRef.current = Date.now() + timeLeft * 1000
    setStatus('running')
    tick()
    intervalRef.current = setInterval(tick, TICK_MS)
  }, [status, timeLeft, tick])

  const resetTimer = useCallback(() => {
    clearIntervalRef()
    endTimeRef.current = null
    setTimeLeft(duration * 60)
    setStatus('idle')
  }, [duration, clearIntervalRef])

  const canStart = status !== 'running' && duration > 0
  const canPause = status === 'running'
  const canResume = status === 'paused' && timeLeft > 0

  return (
    <section className="max-w-2xl mx-auto space-y-6">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--accent-bg)] p-6 md:p-8">
        <h2 className="text-[var(--text-h)] font-[var(--heading)] text-lg font-medium mb-3">
          Focus Timer
        </h2>
        <p className="text-sm text-[var(--text)] mb-5">
          Block distracting sites and focus for a set duration. When time runs out, a focus screen appears.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 items-end">
          <div className="col-span-3 sm:col-span-2">
            <label className="block text-xs text-[var(--text)] mb-2">Sites to block</label>
            <textarea
              value={sitesText}
              onChange={event => {
                const value = event.target.value
                setSitesText(value)
                setSites(value.split(/[,\n\r]+/).map(site => site.trim()).filter(Boolean))
              }}
              rows={3}
              className="w-full rounded border border-[var(--border)] bg-[var(--bg)] p-3 text-[var(--text-h)] placeholder-[var(--text)] focus:border-[var(--accent-border)] focus:outline-2 focus:outline-[var(--accent)]"
              placeholder="instagram.com, twitter.com, youtube.com"
            />
            <p className="text-xs text-[var(--text)] mt-2">Comma or new line separated.</p>
          </div>

          <div>
            <label className="block text-xs text-[var(--text)] mb-2">Duration (minutes)</label>
            <input
              type="number"
              min="1"
              value={duration}
              onChange={event => setDuration(Math.max(1, Number(event.target.value) || 1))}
              className="w-full rounded border border-[var(--border)] bg-[var(--bg)] p-3 text-[var(--text-h)] focus:border-[var(--accent-border)] focus:outline-2 focus:outline-[var(--accent)]"
            />
          </div>

          <div className="w-full">
            <button
              type="button"
              disabled={!canStart}
              onClick={startTimer}
              className="w-full rounded bg-[var(--accent)] text-[var(--bg)] px-4 py-3 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'running' ? 'Running…' : 'Start'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <span className="font-[var(--mono)] text-6xl font-medium text-[var(--text-h)]">
          {formatSeconds(timeLeft)}
        </span>
        {status === 'complete' && (
          <span className="text-xs text-[var(--accent)] font-medium animate-pulse">Time is up!</span>
        )}
      </div>

      <div className="flex justify-center gap-3">
        <button
          type="button"
          disabled={!canPause}
          onClick={pauseTimer}
          className="rounded border border-[var(--border)] bg-[var(--bg)] px-5 py-2 text-[var(--text-h)] text-sm hover:bg-[var(--accent-bg)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Pause
        </button>
        <button
          type="button"
          disabled={!canResume}
          onClick={resumeTimer}
          className="rounded border border-[var(--border)] bg-[var(--bg)] px-5 py-2 text-[var(--text-h)] text-sm hover:bg-[var(--accent-bg)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Resume
        </button>
        <button
          type="button"
          onClick={resetTimer}
          className="rounded border border-[var(--border)] bg-[var(--bg)] px-5 py-2 text-[var(--text-h)] text-sm hover:bg-[var(--accent-bg)]"
        >
          Reset
        </button>
      </div>

      {status === 'complete' && (
        <div
          id="focus-complete-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="focus-complete-title"
          aria-live="polite"
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 p-6 text-[var(--bg)] bg-[var(--accent)]"
        >
          <div className="rounded-full border border-[var(--bg)] p-3 text-[var(--text-h)] font-[var(--mono)] text-4xl">
            {formatSeconds(0)}
          </div>
          <h2 id="focus-complete-title" className="text-[var(--text-h)] font-[var(--heading)] text-2xl font-medium">
            Focus time is up!
          </h2>
          <p className="text-[var(--text-h)]">Great work — take a well-earned break.</p>
          <button
            type="button"
            onClick={resetTimer}
            className="rounded bg-[var(--bg)] text-[var(--accent)] px-6 py-2 text-sm font-medium hover:opacity-90"
          >
            Reset Timer
          </button>
        </div>
      )}
    </section>
  )
}
