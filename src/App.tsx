import { useCallback, useEffect, useState } from 'react'
import NavTabs from './components/NavTabs'
import FocusTimer from './components/FocusTimer'
import StudyTracker from './components/StudyTracker'
import TeamMembers from './components/TeamMembers'

type Tab = 'focus' | 'study' | 'team'

interface StudySession {
  id: string
  member: string
  minutes: number
  date: string
}

const TEAM_MEMBERS: readonly string[] = ['Islam', 'Omar', 'Mohammed', 'Kareem', 'Feras', 'Mostafa']

const STUDY_STORAGE_KEY = 'focus-study-sessions-v1'

function loadSessions(): StudySession[] {
  try {
    const raw = window.localStorage.getItem(STUDY_STORAGE_KEY)
    if (raw === null) return []
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (session): session is StudySession =>
          session != null &&
          typeof session === 'object' &&
          typeof session.id === 'string' &&
          typeof session.member === 'string' &&
          typeof session.minutes === 'number' &&
          typeof session.date === 'string',
      )
    }
  } catch {
    // Malformed stored data — start fresh.
  }
  return []
}

export default function App() {
  const [tab, setTab] = useState<Tab>('focus')
  const [sessions, setSessions] = useState<StudySession[]>(loadSessions)

  useEffect(() => {
    try {
      window.localStorage.setItem(STUDY_STORAGE_KEY, JSON.stringify(sessions))
    } catch {
      // Storage unavailable or quota exceeded — persistence is best effort.
    }
  }, [sessions])

  const addSession = useCallback(
    (member: string, minutes: number, date: string) => {
      setSessions(prev => [...prev, { id: crypto.randomUUID(), member, minutes, date }])
    },
    [],
  )

  const tabs = [
    { id: 'focus' as const, label: 'Focus Timer' },
    { id: 'study' as const, label: 'Study Tracker' },
    { id: 'team' as const, label: 'Team Members' },
  ] as const

  return (
    <div className="bg-[var(--bg)] text-[var(--text)] min-h-screen font-sans transition-colors duration-300">
      <NavTabs tabs={tabs} active={tab} onChange={setTab} />
      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
        {tab === 'focus' && <FocusTimer />}
        {tab === 'study' && (
          <StudyTracker members={TEAM_MEMBERS} sessions={sessions} onLog={addSession} />
        )}
        {tab === 'team' && <TeamMembers members={TEAM_MEMBERS} sessions={sessions} />}
      </main>
    </div>
  )
}
