import { useDailyLog, type Flow } from '../lib/useDailyLog'
import { todayISO } from '../lib/cycleStats'

const FLOW_OPTIONS: { value: Flow; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'spotting', label: 'Spotting' },
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' },
]

const MOOD_OPTIONS = ['Happy', 'Calm', 'Irritable', 'Sad', 'Anxious', 'Energized', 'Tired']

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-[44px] rounded-full border px-4 text-sm font-medium ${
        selected ? 'border-primary bg-primary text-white' : 'border-border text-ink'
      }`}
    >
      {children}
    </button>
  )
}

export default function Log() {
  const { log, setLog, allSymptoms, selectedSymptomIds, toggleSymptom, loading, saving, error, save } =
    useDailyLog(todayISO())

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted">Loading…</p>
      </div>
    )
  }

  return (
    <div className="p-6 pb-8">
      <h1 className="text-2xl font-semibold text-ink">Log</h1>
      <p className="mt-1 text-sm text-muted">Today, {todayISO()}</p>

      {error && (
        <p role="alert" className="mt-2 text-sm text-primary">
          {error}
        </p>
      )}

      <fieldset className="mt-6">
        <legend className="text-sm font-medium text-ink">Flow</legend>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Flow">
          {FLOW_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              selected={log.flow === opt.value}
              onClick={() => setLog((l) => ({ ...l, flow: l.flow === opt.value ? null : opt.value }))}
            >
              {opt.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="text-sm font-medium text-ink">Energy</legend>
        <div className="mt-2 flex gap-2" role="group" aria-label="Energy level, 1 low to 5 high">
          {[1, 2, 3, 4, 5].map((n) => (
            <Chip
              key={n}
              selected={log.energy === n}
              onClick={() => setLog((l) => ({ ...l, energy: l.energy === n ? null : n }))}
            >
              {String(n)}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="text-sm font-medium text-ink">Mood</legend>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Mood">
          {MOOD_OPTIONS.map((m) => (
            <Chip
              key={m}
              selected={log.mood === m}
              onClick={() => setLog((l) => ({ ...l, mood: l.mood === m ? null : m }))}
            >
              {m}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="text-sm font-medium text-ink">Symptoms</legend>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Symptoms">
          {allSymptoms.map((s) => (
            <Chip key={s.id} selected={selectedSymptomIds.has(s.id)} onClick={() => toggleSymptom(s.id)}>
              {s.name}
            </Chip>
          ))}
        </div>
      </fieldset>

      <div className="mt-6">
        <label htmlFor="notes" className="block text-sm font-medium text-ink">
          Notes <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="notes"
          rows={3}
          value={log.notes ?? ''}
          onChange={(e) => setLog((l) => ({ ...l, notes: e.target.value || null }))}
          className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-base"
        />
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="mt-6 min-h-[44px] w-full rounded-xl bg-primary py-3 font-medium text-white shadow-sm active:opacity-90 disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}
