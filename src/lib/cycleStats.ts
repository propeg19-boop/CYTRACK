export type Cycle = {
  id: string
  start_date: string // YYYY-MM-DD
  end_date: string | null
}

export type CycleStats = {
  currentCycleDay: number | null
  averageLength: number | null // rounded days, null until 2+ cycles exist
  predictedNextStart: string | null // YYYY-MM-DD
  averagePeriodLength: number | null // rounded days, null until a period has an end_date
  predictedNextEnd: string | null // YYYY-MM-DD, null unless both predictions are known
}

export function daysBetween(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay)
}

function addDays(date: string, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

// Cycles must be sorted oldest-first. Average length comes from the gaps
// between consecutive start dates — the same definition doctors use
// ("cycle length" = start of one period to start of the next).
export function computeCycleStats(cyclesOldestFirst: Cycle[]): CycleStats {
  const empty: CycleStats = {
    currentCycleDay: null,
    averageLength: null,
    predictedNextStart: null,
    averagePeriodLength: null,
    predictedNextEnd: null,
  }
  if (cyclesOldestFirst.length === 0) return empty

  const latest = cyclesOldestFirst[cyclesOldestFirst.length - 1]
  const currentCycleDay = daysBetween(latest.start_date, todayISO()) + 1

  const completed = cyclesOldestFirst.filter((c) => c.end_date !== null)
  const averagePeriodLength = completed.length
    ? Math.round(
        completed.reduce((sum, c) => sum + (daysBetween(c.start_date, c.end_date!) + 1), 0) /
          completed.length,
      )
    : null

  const gaps: number[] = []
  for (let i = 1; i < cyclesOldestFirst.length; i++) {
    gaps.push(daysBetween(cyclesOldestFirst[i - 1].start_date, cyclesOldestFirst[i].start_date))
  }

  if (gaps.length === 0) {
    return { ...empty, currentCycleDay, averagePeriodLength }
  }

  const averageLength = Math.round(gaps.reduce((sum, g) => sum + g, 0) / gaps.length)
  const predictedNextStart = addDays(latest.start_date, averageLength)
  const predictedNextEnd = averagePeriodLength
    ? addDays(predictedNextStart, averagePeriodLength - 1)
    : null

  return {
    currentCycleDay,
    averageLength,
    predictedNextStart,
    averagePeriodLength,
    predictedNextEnd,
  }
}

// Was this date inside a logged period? Ongoing periods (no end_date yet)
// count through today, not into the future.
export function isActualPeriodDay(dateISO: string, cycles: Cycle[]): boolean {
  return cycles.some((c) => {
    const end = c.end_date ?? todayISO()
    return dateISO >= c.start_date && dateISO <= end
  })
}

export function isPredictedPeriodDay(dateISO: string, stats: CycleStats): boolean {
  if (!stats.predictedNextStart || !stats.predictedNextEnd) return false
  return dateISO >= stats.predictedNextStart && dateISO <= stats.predictedNextEnd
}
