import { useCycles } from '../lib/useCycles'
import { useAnalyticsLogs } from '../lib/useAnalyticsLogs'
import { computeCycleStats } from '../lib/cycleStats'
import { cycleLengthTrend, frequency, type FrequencyPoint } from '../lib/analytics'

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-primary-soft p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-xl font-semibold text-primary">{value}</p>
    </div>
  )
}

function FrequencyBars({ title, data, emptyText }: { title: string; data: FrequencyPoint[]; emptyText: string }) {
  const max = data[0]?.count ?? 0
  return (
    <div className="mt-6">
      <h2 className="text-sm font-medium text-ink">{title}</h2>
      {data.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{emptyText}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {data.map((d) => (
            <li key={d.label}>
              <div className="flex justify-between text-sm text-ink">
                <span>{d.label}</span>
                <span className="text-muted">{d.count}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-border">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${max ? (d.count / max) * 100 : 0}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function Insights() {
  const { cycles, loading: cyclesLoading } = useCycles()
  const { logs, loading: logsLoading } = useAnalyticsLogs()

  const stats = computeCycleStats(cycles)
  const trend = cycleLengthTrend(cycles)
  const symptomCounts = frequency(logs.flatMap((l) => l.symptomNames))
  const moodCounts = frequency(logs.map((l) => l.mood))

  const loading = cyclesLoading || logsLoading

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted">Loading…</p>
      </div>
    )
  }

  // Chart geometry — small, fixed viewBox, scaled to the data's own range.
  const chartW = 320
  const chartH = 120
  const pad = 16
  const lengths = trend.map((p) => p.length)
  const minLen = lengths.length ? Math.min(...lengths) : 0
  const maxLen = lengths.length ? Math.max(...lengths) : 0
  const range = Math.max(maxLen - minLen, 1)
  const points = trend.map((p, i) => {
    const x = trend.length > 1 ? pad + (i / (trend.length - 1)) * (chartW - pad * 2) : chartW / 2
    const y = chartH - pad - ((p.length - minLen) / range) * (chartH - pad * 2)
    return { x, y, length: p.length }
  })
  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <div className="p-6 pb-8">
      <h1 className="text-2xl font-semibold text-ink">Insights</h1>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatCard label="Avg cycle length" value={stats.averageLength ? `${stats.averageLength}d` : '—'} />
        <StatCard label="Avg period length" value={stats.averagePeriodLength ? `${stats.averagePeriodLength}d` : '—'} />
        <StatCard label="Periods logged" value={String(cycles.length)} />
        <StatCard label="Days logged" value={String(logs.length)} />
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-medium text-ink">Cycle length trend</h2>
        {trend.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Log at least two periods to see a trend.</p>
        ) : (
          <>
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              role="img"
              aria-label={`Cycle lengths, oldest to newest: ${lengths.join(', ')} days`}
              className="mt-2 w-full"
            >
              <polyline points={polyline} fill="none" stroke="var(--color-primary)" strokeWidth={2} />
              {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="var(--color-primary)" />
              ))}
            </svg>
            <p className="mt-1 text-xs text-muted">
              {minLen}–{maxLen} days across {trend.length} tracked {trend.length === 1 ? 'gap' : 'gaps'}
            </p>
          </>
        )}
      </div>

      <FrequencyBars title="Most common symptoms" data={symptomCounts} emptyText="No symptoms logged yet." />
      <FrequencyBars title="Mood distribution" data={moodCounts} emptyText="No moods logged yet." />
    </div>
  )
}
