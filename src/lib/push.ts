import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window
}

// Web Push wants the VAPID key as a Uint8Array, browsers give it to us as
// base64url. This is the standard conversion — no library needed for it.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export async function subscribeToPush(userId: string): Promise<void> {
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
  })

  const json = subscription.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: json.endpoint!,
      p256dh: json.keys!.p256dh,
      auth_key: json.keys!.auth,
    },
    { onConflict: 'endpoint' },
  )
  if (error) throw error

  await supabase
    .from('notification_settings')
    .upsert({ user_id: userId, reminders_enabled: true }, { onConflict: 'user_id' })
}

export async function unsubscribeFromPush(userId: string): Promise<void> {
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()

  if (subscription) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
    await subscription.unsubscribe()
  }

  await supabase
    .from('notification_settings')
    .upsert({ user_id: userId, reminders_enabled: false }, { onConflict: 'user_id' })
}
