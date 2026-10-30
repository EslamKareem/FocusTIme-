import { useMemo } from 'react'

interface Session {
  id: string
  member: string
  minutes: number
  date: string
}

interface TeamMembersProps {
  members: readonly string[]
  sessions: Session[]
}

export default function TeamMembers({ members, sessions }: TeamMembersProps) {
  const minutesByMember = useMemo(() => {
    const map = new Map<string, number>()
    for (const session of sessions) {
      map.set(session.member, (map.get(session.member) ?? 0) + session.minutes)
    }
    return map
  }, [sessions])

  const ranked = useMemo(
    () =>
      [...members].sort(
        (a, b) =>
          (minutesByMember.get(b) ?? 0) - (minutesByMember.get(a) ?? 0) || a.localeCompare(b),
      ),
    [members, minutesByMember],
  )

  return (
    <section className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 md:p-8">
        <h2 className="text-[var(--text-h)] font-[var(--heading)] text-lg font-medium mb-2">
          Team Members
        </h2>
        <p className="text-[var(--text)] text-sm">
          The Focus Time team: {members.length} members. Ranking is based on logged study minutes.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {ranked.map((member, index) => {
          const minutes = minutesByMember.get(member) ?? 0
          return (
            <div key={member} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 flex flex-col items-center">
              <span className="text-[var(--text-h)] font-[var(--heading)] font-bold text-sm">
                {member}
              </span>
              <span className="inline-block mt-2 text-[var(--text)] text-xs font-[var(--mono)]">
                #{index + 1}
              </span>
              <p className="mt-3 font-[var(--mono)] text-lg font-medium">{minutes} minutes</p>
              <p className="mt-1 text-xs text-[var(--text)]">
                {Math.floor(minutes / 60)}h {minutes % 60}m
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
