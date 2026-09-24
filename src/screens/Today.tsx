import { useCycles } from '../lib/useCycles'
import { computeCycleStats } from '../lib/cycleStats'
import { useDailyInsight } from '../lib/useDailyInsight'
import CycleHistory from '../components/CycleHistory'

export default function Today() {
  const { cycles, openCycle, loading, error, startPeriod, endPeriod, updateCycle, deleteCycle } =
    useCycles()
  const stats = computeCycleStats(cycles)
  const insight = useDailyInsight()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-ink">Today</h1>

      {error && (
        <p role="alert" className="mt-2 text-sm text-primary">
          {error}
        </p>
      )}

      <div className="mt-6 rounded-2xl bg-primary-soft p-5">
        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : stats.currentCycleDay === null ? (
          <>
            <p className="text-sm text-muted">Cycle Day</p>
            <p className="text-3xl font-bold text-primary">—</p>
            <p className="mt-2 text-sm text-muted">
              No cycle data yet. Log your last period to get started.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">Cycle Day</p>
            <p className="text-3xl font-bold text-primary">{stats.currentCycleDay}</p>
            <p className="mt-2 text-sm text-muted">
              {stats.predictedNextStart
                ? `Next period estimated around ${stats.predictedNextStart}`
                : 'Log one more period to get a prediction.'}
            </p>
          </>
        )}
      </div>

      {!insight.loading && insight.content && (
        <div className="mt-4 rounded-xl border border-border p-4">
          <p className="text-sm text-ink">{insight.content}</p>
          <p className="mt-2 text-xs text-muted">AI-generated, not medical advice.</p>
        </div>
      )}

      <button
        onClick={openCycle ? endPeriod : startPeriod}
        disabled={loading}
        className="mt-6 min-h-[44px] w-full rounded-xl bg-primary py-3 font-medium text-white shadow-sm active:opacity-90 disabled:opacity-60"
      >
        {openCycle ? 'End Period' : 'Start Period'}
      </button>

      <CycleHistory cycles={cycles} onUpdate={updateCycle} onDelete={deleteCycle} />
    </div>
  )
}
