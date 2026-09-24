import { daysBetween, type Cycle } from './cycleStats'

export type CycleLengthPoint = { fromDate: string; length: number }

// One point per gap between consecutive periods — same definition as
// computeCycleStats' averageLength, just exposed per-cycle for charting.
export function cycleLengthTrend(cyclesOldestFirst: Cycle[]): CycleLengthPoint[] {
  const points: CycleLengthPoint[] = []
  for (let i = 1; i < cyclesOldestFirst.length; i++) {
    points.push({
      fromDate: cyclesOldestFirst[i - 1].start_date,
      length: daysBetween(cyclesOldestFirst[i - 1].start_date, cyclesOldestFirst[i].start_date),
    })
  }
  return points
}

export type FrequencyPoint = { label: string; count: number }

export function frequency(values: (string | null)[]): FrequencyPoint[] {
  const counts = new Map<string, number>()
  for (const v of values) {
    if (v === null) continue
    counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
}
