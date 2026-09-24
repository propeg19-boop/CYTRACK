import type { Cycle } from '../lib/cycleStats'

type Props = {
  cycles: Cycle[] // any order in
  onUpdate: (id: string, updates: Partial<Pick<Cycle, 'start_date' | 'end_date'>>) => void
  onDelete: (id: string) => void
}

export default function CycleHistory({ cycles, onUpdate, onDelete }: Props) {
  const mostRecentFirst = [...cycles].sort((a, b) => b.start_date.localeCompare(a.start_date))

  if (mostRecentFirst.length === 0) {
    return <p className="mt-6 text-sm text-muted">No periods logged yet.</p>
  }

  return (
    <div className="mt-6">
      <h2 className="text-sm font-medium text-ink">History</h2>
      <ul className="mt-2 divide-y divide-border">
        {mostRecentFirst.map((cycle) => (
          <li key={cycle.id} className="flex items-center gap-2 py-3">
            <div className="flex flex-1 items-center gap-2">
              <label className="sr-only" htmlFor={`start-${cycle.id}`}>
                Start date
              </label>
              <input
                id={`start-${cycle.id}`}
                type="date"
                value={cycle.start_date}
                onChange={(e) => onUpdate(cycle.id, { start_date: e.target.value })}
                className="min-h-[44px] rounded-lg border border-border px-2 text-sm"
              />
              <span className="text-muted">–</span>
              <label className="sr-only" htmlFor={`end-${cycle.id}`}>
                End date
              </label>
              <input
                id={`end-${cycle.id}`}
                type="date"
                value={cycle.end_date ?? ''}
                onChange={(e) => onUpdate(cycle.id, { end_date: e.target.value || null })}
                placeholder="Ongoing"
                className="min-h-[44px] rounded-lg border border-border px-2 text-sm"
              />
            </div>
            <button
              onClick={() => {
                if (confirm('Delete this period entry?')) onDelete(cycle.id)
              }}
              aria-label="Delete period entry"
              className="min-h-[44px] min-w-[44px] text-sm text-primary"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
