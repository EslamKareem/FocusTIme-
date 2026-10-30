import { useCallback, useMemo, useState } from 'react'

interface StudySession {
  id: string
  member: string
  minutes: number
  date: string
}

interface StudyTrackerProps {
  members: readonly string[]
  sessions: StudySession[]
  onLog: (member: string, minutes: number, date: string) => void
}

const MILESTONES: readonly {
  readonly hours: number
  readonly minutes: number
  readonly label: string
  readonly badge: string
}[] = [
  { hours: 1, minutes: 60, label: '1 Hour', badge: '' },
  { hours: 5, minutes: 300, label: '5 Hours', badge: '' },
  { hours: 20, minutes: 1200, label: '20 Hours', badge: '' },
]

export default function StudyTracker({ members, sessions, onLog }: StudyTrackerProps) {
  const [member, setMember] = useState('')
  const [minutesText, setMinutesText] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))

  const totalMinutes = useMemo(() => sessions.reduce((sum, session) => sum + session.minutes, 0), [sessions])

  const minutesByMember = useMemo(() => {
    const map = new Map<string, number>()
    for (const session of sessions) {
      map.set(session.member, (map.get(session.member) ?? 0) + session.minutes)
    }
    return map
  }, [sessions])

  const leaderboard = useMemo(() => {
    return [...minutesByMember.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([member, minutes], index) => ({ rank: index + 1, member, minutes }))
  }, [minutesByMember])

  const earnedBadges = useMemo(
    () => MILESTONES.filter(milestone => totalMinutes >= milestone.minutes),
    [totalMinutes],
  )

  const minutesValue = Number(minutesText)
  const canLog = members.includes(member) && Number.isFinite(minutesValue) && minutesValue > 0 && !!date

  const handleLog = useCallback(() => {
    if (!canLog) return
    onLog(member, minutesValue, date)
    setMinutesText('')
  }, [member, minutesValue, date, canLog, onLog])

  return (
    <section className="max-w-3xl mx-auto space-y-6">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 md:p-8">
        <h2 className="text-[var(--text-h)] font-[var(--heading)] text-lg font-medium mb-4">
          Log Study Session
        </h2>
        <form
          onSubmit={event => {
            event.preventDefault()
            handleLog()
          }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-4 items-end"
        >
          <div className="col-span-3 sm:col-span-2">
            <label htmlFor="member-select" className="block text-xs text-[var(--text)] mb-2">Member</label>
            <select
              id="member-select"
              value={member}
              onChange={event => setMember(event.target.value)}
              className="w-full rounded border border-[var(--border)] bg-[var(--bg)] p-3 text-[var(--text-h)] focus:border-[var(--accent-border)] focus:outline-2 focus:outline-[var(--accent)]"
            >
              <option value="">Select a team member</option>
              {members.map(m => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="minutes-input" className="block text-xs text-[var(--text)] mb-2">Minutes</label>
            <input
              id="minutes-input"
              type="number"
              min="1"
              value={minutesText}
              onChange={event => setMinutesText(event.target.value)}
              className="w-full rounded border border-[var(--border)] bg-[var(--bg)] p-3 text-[var(--text-h)] focus:border-[var(--accent-border)] focus:outline-2 focus:outline-[var(--accent)]"
            />
          </div>

          <div>
            <label htmlFor="date-input" className="block text-xs text-[var(--text)] mb-2">Date</label>
            <input
              id="date-input"
              type="date"
              value={date}
              onChange={event => setDate(event.target.value)}
              className="w-full rounded border border-[var(--border)] bg-[var(--bg)] p-3 text-[var(--text-h)] focus:border-[var(--accent-border)] focus:outline-2 focus:outline-[var(--accent)]"
            />
          </div>

          <div className="col-span-3 sm:col-span-1">
            <button
              type="submit"
              disabled={!canLog}
              className="w-full rounded bg-[var(--accent)] text-[var(--bg)] px-4 py-3 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Log Session
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-[var(--text-h)] font-[var(--heading)] mb-1">Total Study Time</h3>
            <p className="font-[var(--mono)] text-3xl text-[var(--text-h)]">
              {totalMinutes} minutes
            </p>
            <p className="text-xs text-[var(--text)]">
              {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {earnedBadges.length > 0 ? (
              earnedBadges.map(badge => (
                <span
                  key={badge.label}
                  className="inline-flex items-center gap-1.5 rounded border border-[var(--accent-border)] bg-[var(--accent-bg)] px-3 py-1.5 text-[var(--accent)] text-sm font-medium"
                >
                  {badge.label} milestone
                </span>
              ))
            ) : (
              <span className="text-xs text-[var(--text)]">Milestones: 1h • 5h • 20h</span>
            )}
          </div>
        </div>

        <h3 className="text-[var(--text-h)] font-[var(--heading)] mb-3">Leaderboard</h3>
        {leaderboard.length === 0 ? (
          <p className="text-[var(--text)] text-sm">No sessions yet. Log your first session above.</p>
        ) : (
          <table className="w-full text-left border-collapse rounded-lg border border-[var(--border)]">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--accent-bg)]">
                <th scope="col" className="p-3 text-xs text-[var(--text)] font-medium">Rank</th>
                <th scope="col" className="p-3 text-xs text-[var(--text)] font-medium">Member</th>
                <th className="p-3 text-xs text-[var(--text)] font-medium text-right">Minutes</th>
                <th className="p-3 text-xs text-[var(--text)] font-medium text-right">Hours</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map(entry => (
                <tr key={entry.member} className="border-b border-[var(--border)] last:border-0">
                  <td className="p-3 font-[var(--mono)] font-medium">{entry.rank}</td>
                  <td className="p-3 text-[var(--text-h)] font-medium">{entry.member}</td>
                  <td className="p-3 font-[var(--mono)] text-right">{entry.minutes}</td>
                  <td className="p-3 font-[var(--mono)] text-right text-[var(--text)]">
                    {(entry.minutes / 60).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
