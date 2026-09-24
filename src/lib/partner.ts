import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from './AuthContext'

export type SharingPermissions = {
  share_period: boolean
  share_cycle_day: boolean
  share_symptoms: boolean
  share_mood: boolean
  share_history: boolean
}

export type OwnerConnection = {
  id: string
  invite_code: string
  status: 'pending' | 'accepted'
  partner_id: string | null
  permissions: SharingPermissions | null
}

export type PartnerLink = {
  id: string
  owner_id: string
  status: 'pending' | 'accepted'
}

function generateInviteCode(): string {
  // Avoid visually ambiguous characters (0/O, 1/I/l) since this gets typed
  // by hand on a phone keyboard.
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
}

export function usePartnerMode() {
  const { session } = useAuth()
  const [asOwner, setAsOwner] = useState<OwnerConnection | null>(null)
  const [asPartner, setAsPartner] = useState<PartnerLink | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError(null)

    const [ownerRes, partnerRes] = await Promise.all([
      supabase
        .from('partner_connections')
        .select('id, invite_code, status, partner_id, sharing_permissions(*)')
        .eq('owner_id', session.user.id)
        .maybeSingle(),
      supabase
        .from('partner_connections')
        .select('id, owner_id, status')
        .eq('partner_id', session.user.id)
        .maybeSingle(),
    ])

    if (ownerRes.error) setError(ownerRes.error.message)
    else if (ownerRes.data) {
      const { sharing_permissions, ...rest } = ownerRes.data as any
      setAsOwner({ ...rest, permissions: sharing_permissions ?? null })
    } else {
      setAsOwner(null)
    }

    if (partnerRes.error) setError((e) => e ?? partnerRes.error!.message)
    else setAsPartner((partnerRes.data as PartnerLink) ?? null)

    setLoading(false)
  }, [session])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function createInvite() {
    if (!session) return
    const invite_code = generateInviteCode()
    const { data, error } = await supabase
      .from('partner_connections')
      .insert({ owner_id: session.user.id, invite_code, status: 'pending' })
      .select('id')
      .single()
    if (error || !data) {
      setError(error?.message ?? 'Could not create invite.')
      return
    }
    const { error: permErr } = await supabase.from('sharing_permissions').insert({ connection_id: data.id })
    if (permErr) setError(permErr.message)
    await refresh()
  }

  async function acceptInvite(code: string) {
    setError(null)
    const { error } = await supabase.functions.invoke('accept-invite', {
      body: { invite_code: code.trim().toUpperCase() },
    })
    if (error) {
      setError(error.message)
      return false
    }
    await refresh()
    return true
  }

  async function updateSharing(updates: Partial<SharingPermissions>) {
    if (!asOwner) return
    const { error } = await supabase
      .from('sharing_permissions')
      .update(updates)
      .eq('connection_id', asOwner.id)
    if (error) setError(error.message)
    else await refresh()
  }

  return { asOwner, asPartner, loading, error, createInvite, acceptInvite, updateSharing }
}
