import { useState } from 'react'
import { useCycles } from '../lib/useCycles'
import {
  computeCycleStats,
  isActualPeriodDay,
  isPredictedPeriodDay,
  todayISO,
} from '../lib/cycleStats'

const monthLabel = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' })
const weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function toISO(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

export default function Calendar() {
  const { cycles } = useCycles()
  const stats = computeCycleStats(cycles)
  const today = todayISO()

  const [viewDate, setViewDate] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const firstOfMonth = new Date(viewDate.year, viewDate.month, 1)
  const daysInMonth = new Date(viewDate.year, viewDate.month + 1, 0).getDate()
  const leadingBlanks = firstOfMonth.getDay()

  function changeMonth(delta: number) {
    setViewDate(({ year, month }) => {
      const d = new Date(year, month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  const cells: Array<{ day: number; iso: string } | null> = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      iso: toISO(viewDate.year, viewDate.month, i + 1),
    })),
  ]

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-ink">Calendar</h1>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => changeMonth(-1)}
          aria-label="Previous month"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center text-ink"
        >
          ‹
        </button>
        <p className="font-medium text-ink">
          {monthLabel.format(new Date(viewDate.year, viewDate.month, 1))}
        </p>
        <button
          onClick={() => changeMonth(1)}
          aria-label="Next month"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center text-ink"
        >
          ›
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center">
        {weekdayLabels.map((label) => (
          <div key={label} aria-hidden className="text-xs font-medium text-muted">
            {label}
          </div>
        ))}

        {cells.map((cell, i) => {
          if (!cell) return <div key={`blank-${i}`} />

          const isActual = isActualPeriodDay(cell.iso, cycles)
          const isPredicted = !isActual && isPredictedPeriodDay(cell.iso, stats)
          const isToday = cell.iso === today

          const label = `${cell.iso}${isActual ? ', period logged' : isPredicted ? ', predicted period' : ''}${isToday ? ', today' : ''}`

          return (
            <div
              key={cell.iso}
              aria-label={label}
              className={`flex aspect-square items-center justify-center rounded-full text-sm ${
                isActual
                  ? 'bg-primary font-medium text-white'
                  : isPredicted
                    ? 'border-2 border-primary text-primary'
                    : 'text-ink'
              } ${isToday && !isActual ? 'underline decoration-2 underline-offset-4' : ''}`}
            >
              {cell.day}
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex gap-4 text-sm text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-primary" aria-hidden /> Period logged
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border-2 border-primary" aria-hidden /> Predicted
        </span>
      </div>
    </div>
  )
}
