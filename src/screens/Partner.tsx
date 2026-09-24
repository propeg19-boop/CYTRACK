import { useState } from 'react'
import { usePartnerMode, type SharingPermissions } from '../lib/partner'
import { useSharedOwnerData } from '../lib/useSharedOwnerData'
import { useObservations } from '../lib/useObservations'
import Toggle from '../components/Toggle'

const SHARE_LABELS: { key: keyof SharingPermissions; label: string }[] = [
  { key: 'share_period', label: 'Period dates' },
  { key: 'share_cycle_day', label: 'Current cycle day' },
  { key: 'share_mood', label: 'Mood' },
  { key: 'share_symptoms', label: 'Symptoms' },
  { key: 'share_history', label: 'Full daily notes (everything)' },
]

function OwnerSection({
  asOwner,
  loading,
  error,
  createInvite,
  updateSharing,
}: Pick<ReturnType<typeof usePartnerMode>, 'asOwner' | 'loading' | 'error' | 'createInvite' | 'updateSharing'>) {
  const [copied, setCopied] = useState(false)

  if (loading) return <p className="text-sm text-muted">Loading…</p>

  if (!asOwner) {
    return (
      <div>
        <p className="text-sm text-muted">
          Invite someone to see a limited, permission-controlled view of your cycle data.
        </p>
        <button
          onClick={createInvite}
          className="mt-3 min-h-[44px] rounded-xl bg-primary px-4 font-medium text-white"
        >
          Create invite
        </button>
      </div>
    )
  }

  if (asOwner.status === 'pending') {
    return (
      <div>
        <p className="text-sm text-muted">Share this code with your partner:</p>
        <div className="mt-2 flex items-center gap-2">
          <p className="rounded-xl bg-primary-soft px-4 py-2 text-lg font-semibold tracking-widest text-primary">
            {asOwner.invite_code}
          </p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(asOwner.invite_code)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
            className="min-h-[44px] rounded-xl border border-border px-3 text-sm text-ink"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">Waiting for them to accept.</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm font-medium text-ink">Connected</p>
      <p className="mt-1 text-xs text-muted">Choose what your partner can see:</p>
      <ul className="mt-3 space-y-3">
        {SHARE_LABELS.map(({ key, label }) => (
          <li key={key} className="flex items-center justify-between">
            <span className="text-sm text-ink">{label}</span>
            <Toggle
              checked={asOwner.permissions?.[key] ?? false}
              onChange={() => updateSharing({ [key]: !(asOwner.permissions?.[key] ?? false) })}
              label={label}
            />
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="mt-2 text-sm text-primary">
          {error}
        </p>
      )}
    </div>
  )
}

function PartnerSection({
  asPartner,
  loading,
  error,
  acceptInvite,
}: Pick<ReturnType<typeof usePartnerMode>, 'asPartner' | 'loading' | 'error' | 'acceptInvite'>) {
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [acceptError, setAcceptError] = useState<string | null>(null)

  const { stats, logs, loading: dataLoading } = useSharedOwnerData(asPartner?.owner_id)
  const { observations, addObservation } = useObservations(asPartner?.id)
  const [note, setNote] = useState('')

  if (loading) return <p className="text-sm text-muted">Loading…</p>

  if (!asPartner) {
    return (
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          setSubmitting(true)
          setAcceptError(null)
          const ok = await acceptInvite(code)
          if (!ok) setAcceptError('Could not accept — check the code and try again.')
          setSubmitting(false)
        }}
      >
        <label htmlFor="invite-code" className="block text-sm text-muted">
          Have an invite code? Enter it here.
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="invite-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="ABCD1234"
            className="min-h-[44px] flex-1 rounded-xl border border-border px-3 uppercase tracking-widest"
          />
          <button
            type="submit"
            disabled={submitting || !code.trim()}
            className="min-h-[44px] rounded-xl bg-primary px-4 font-medium text-white disabled:opacity-60"
          >
            Connect
          </button>
        </div>
        {acceptError && (
          <p role="alert" className="mt-2 text-sm text-primary">
            {acceptError}
          </p>
        )}
      </form>
    )
  }

  return (
    <div>
      {dataLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <>
          <div className="rounded-xl bg-primary-soft p-4">
            <p className="text-sm text-muted">Cycle Day</p>
            <p className="text-2xl font-bold text-primary">{stats?.currentCycleDay ?? '—'}</p>
            {stats?.predictedNextStart && (
              <p className="mt-1 text-sm text-muted">Next period estimated {stats.predictedNextStart}</p>
            )}
          </div>

          {logs.length > 0 && (
            <ul className="mt-4 space-y-2">
              {logs.slice(0, 7).map((l) => (
                <li key={l.log_date} className="rounded-lg border border-border p-2 text-sm">
                  <p className="font-medium text-ink">{l.log_date}</p>
                  <p className="text-muted">
                    {[l.mood, l.flow, ...(l.symptom_names ?? [])].filter(Boolean).join(' · ') || 'No details shared'}
                  </p>
                  {l.notes && <p className="mt-1 text-ink">{l.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <div className="mt-6">
        <h3 className="text-sm font-medium text-ink">Notes</h3>
        <div className="mt-2 flex gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Leave a note…"
            className="min-h-[44px] flex-1 rounded-xl border border-border px-3"
          />
          <button
            onClick={async () => {
              await addObservation(note)
              setNote('')
            }}
            disabled={!note.trim()}
            className="min-h-[44px] rounded-xl bg-primary px-4 font-medium text-white disabled:opacity-60"
          >
            Add
          </button>
        </div>
        <ul className="mt-3 space-y-2">
          {observations.map((o) => (
            <li key={o.id} className="text-sm">
              <span className="text-muted">{o.observed_date}</span> — {o.content}
            </li>
          ))}
        </ul>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm text-primary">
          {error}
        </p>
      )}
    </div>
  )
}

export default function Partner() {
  const { asOwner, asPartner, loading, error, createInvite, acceptInvite, updateSharing } = usePartnerMode()

  return (
    <div className="p-6 pb-8">
      <h1 className="text-2xl font-semibold text-ink">Partner sharing</h1>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-muted">Your data</h2>
        <div className="mt-2">
          <OwnerSection
            asOwner={asOwner}
            loading={loading}
            error={error}
            createInvite={createInvite}
            updateSharing={updateSharing}
          />
        </div>
      </section>

      <section className="mt-8 border-t border-border pt-6">
        <h2 className="text-sm font-medium text-muted">A tracker shared with you</h2>
        <div className="mt-2">
          <PartnerSection asPartner={asPartner} loading={loading} error={error} acceptInvite={acceptInvite} />
        </div>
      </section>
    </div>
  )
}
