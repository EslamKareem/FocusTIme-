import { useCallback } from 'react'

type Tab = 'focus' | 'study' | 'team'

interface NavTab {
  id: Tab
  label: string
}

interface NavTabsProps {
  tabs: readonly NavTab[]
  active: Tab
  onChange: (tab: Tab) => void
}

export default function NavTabs({ tabs, active, onChange }: NavTabsProps) {
  const handleSelect = useCallback(
    (id: Tab) => () => onChange(id),
    [onChange],
  )

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--bg)] sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 md:p-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 md:p-0">
          <h2 className="text-[var(--text-h)] font-[var(--heading)] text-xl font-medium tracking-tight">
            Focus Time
          </h2>
          <div className="flex gap-2 flex-wrap">
            {tabs.map(tabItem => (
              <button
                key={tabItem.id}
                type="button"
                aria-pressed={active === tabItem.id}
                onClick={handleSelect(tabItem.id)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  active === tabItem.id
                    ? 'bg-[var(--accent-bg)] text-[var(--text-h)] border border-[var(--accent-border)] shadow-sm'
                    : 'text-[var(--text)] hover:bg-[var(--accent-bg)]'
                }`}
              >
                {tabItem.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
