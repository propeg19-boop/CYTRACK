export default function Today() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-ink">Today</h1>
      <p className="mt-1 text-sm text-muted">
        Cycle day, next-period estimate, and quick logging will live here.
      </p>

      <div className="mt-6 rounded-2xl bg-primary-soft p-5">
        <p className="text-sm text-muted">Cycle Day</p>
        <p className="text-3xl font-bold text-primary">—</p>
        <p className="mt-2 text-sm text-muted">
          No cycle data yet. Log your last period to get started.
        </p>
      </div>

      <button className="mt-6 min-h-[44px] w-full rounded-xl bg-primary py-3 font-medium text-white shadow-sm active:opacity-90">
        Start Period
      </button>
    </div>
  )
}
