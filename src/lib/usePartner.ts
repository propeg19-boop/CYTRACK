import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { useAuth } from './AuthContext';
import { PartnerConnection, SharingPermissions, PartnerObservation } from './types';

const LOCAL_PARTNER_KEY = 'cytrack_demo_partner_connection';
const LOCAL_OBSERVATIONS_KEY = 'cytrack_demo_observations';

export function usePartner() {
  const { user, isDemoMode } = useAuth();
  const [connection, setConnection] = useState<PartnerConnection | null>(null);
  const [observations, setObservations] = useState<PartnerObservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load connection and observations
  const fetchPartnerData = useCallback(async () => {
    if (!user) {
      setConnection(null);
      setObservations([]);
      setLoading(false);
      return;
    }

    if (isDemoMode || !isSupabaseConfigured) {
      const storedConn = localStorage.getItem(LOCAL_PARTNER_KEY);
      if (storedConn) {
        setConnection(JSON.parse(storedConn));
      }
      const storedObs = localStorage.getItem(LOCAL_OBSERVATIONS_KEY);
      if (storedObs) {
        setObservations(JSON.parse(storedObs));
      }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Fetch connection where user is either owner or partner
      const { data: connData, error: connErr } = await supabase
        .from('partner_connections')
        .select(`
          *,
          sharing_permissions(*)
        `)
        .or(`owner_id.eq.${user.id},partner_id.eq.${user.id}`)
        .neq('status', 'revoked')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (connErr) throw connErr;

      if (connData) {
        const perms = Array.isArray(connData.sharing_permissions)
          ? connData.sharing_permissions[0]
          : connData.sharing_permissions;

        const formattedConn: PartnerConnection = {
          id: connData.id,
          owner_id: connData.owner_id,
          partner_id: connData.partner_id,
          invite_code: connData.invite_code,
          status: connData.status,
          created_at: connData.created_at,
          updated_at: connData.updated_at,
          permissions: perms || {
            connection_id: connData.id,
            share_cycle: true,
            share_mood: true,
            share_energy: true,
            share_symptoms: true,
          },
        };
        setConnection(formattedConn);

        // Fetch observations for this connection
        const { data: obsData } = await supabase
          .from('partner_observations')
          .select('*')
          .eq('connection_id', connData.id)
          .order('log_date', { ascending: false });

        setObservations((obsData as PartnerObservation[]) || []);
      } else {
        setConnection(null);
        setObservations([]);
      }
      setError(null);
    } catch (err: any) {
      console.error('Error fetching partner data:', err);
      setError(err.message || 'Failed to load partner status');
    } finally {
      setLoading(false);
    }
  }, [user, isDemoMode]);

  useEffect(() => {
    fetchPartnerData();
  }, [fetchPartnerData]);

  // Generate a new 6-character partner invite
  const createInvite = async () => {
    if (!user) return;
    const inviteCode = 'CY-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    if (isDemoMode || !isSupabaseConfigured) {
      const newConn: PartnerConnection = {
        id: 'conn-' + Date.now(),
        owner_id: user.id,
        partner_id: null,
        invite_code: inviteCode,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        permissions: {
          connection_id: 'conn-' + Date.now(),
          share_cycle: true,
          share_mood: true,
          share_energy: true,
          share_symptoms: true,
        },
      };
      localStorage.setItem(LOCAL_PARTNER_KEY, JSON.stringify(newConn));
      setConnection(newConn);
      return newConn;
    }

    // Insert new connection record
    const { data: connData, error: connErr } = await supabase
      .from('partner_connections')
      .insert({
        owner_id: user.id,
        invite_code: inviteCode,
        status: 'pending',
      })
      .select()
      .single();

    if (connErr) throw connErr;

    // Insert default sharing permissions
    await supabase.from('sharing_permissions').insert({
      connection_id: connData.id,
      share_cycle: true,
      share_mood: true,
      share_energy: true,
      share_symptoms: true,
    });

    await fetchPartnerData();
    return connData;
  };

  // Accept an invite code (Partner action)
  const acceptInvite = async (code: string) => {
    if (!user) return { success: false, error: 'Not logged in' };

    if (isDemoMode || !isSupabaseConfigured) {
      const stored = localStorage.getItem(LOCAL_PARTNER_KEY);
      if (stored) {
        const parsed: PartnerConnection = JSON.parse(stored);
        if (parsed.invite_code === code.trim().toUpperCase()) {
          parsed.partner_id = user.id;
          parsed.status = 'active';
          localStorage.setItem(LOCAL_PARTNER_KEY, JSON.stringify(parsed));
          setConnection(parsed);
          return { success: true };
        }
      }
      return { success: false, error: 'Invite code not found in demo mode' };
    }

    try {
      // Call Security Definer RPC
      const { data, error } = await supabase.rpc('accept_partner_invite', {
        p_invite_code: code.trim(),
      });

      if (error) throw error;
      if (!data?.success) {
        return { success: false, error: data?.error || 'Failed to accept invite' };
      }

      await fetchPartnerData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to accept invite' };
    }
  };

  // Update granular sharing permissions (Owner only)
  const updatePermissions = async (perms: Partial<SharingPermissions>) => {
    if (!connection || !connection.permissions) return;

    if (isDemoMode || !isSupabaseConfigured) {
      const updatedConn: PartnerConnection = {
        ...connection,
        permissions: { ...connection.permissions, ...perms },
      };
      localStorage.setItem(LOCAL_PARTNER_KEY, JSON.stringify(updatedConn));
      setConnection(updatedConn);
      return;
    }

    const { error } = await supabase
      .from('sharing_permissions')
      .update({ ...perms, updated_at: new Date().toISOString() })
      .eq('connection_id', connection.id);

    if (error) throw error;
    setConnection(prev =>
      prev && prev.permissions
        ? { ...prev, permissions: { ...prev.permissions, ...perms } }
        : prev
    );
  };

  // Add a partner observation (Partner action)
  const addObservation = async (logDate: string, text: string) => {
    if (!connection || !user || !text.trim()) return;

    if (isDemoMode || !isSupabaseConfigured) {
      const newObs: PartnerObservation = {
        id: 'obs-' + Date.now(),
        connection_id: connection.id,
        author_id: user.id,
        log_date: logDate,
        observation: text.trim(),
        created_at: new Date().toISOString(),
      };
      const updated = [newObs, ...observations];
      localStorage.setItem(LOCAL_OBSERVATIONS_KEY, JSON.stringify(updated));
      setObservations(updated);
      return;
    }

    const { data, error } = await supabase
      .from('partner_observations')
      .insert({
        connection_id: connection.id,
        author_id: user.id,
        log_date: logDate,
        observation: text.trim(),
      })
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setObservations(prev => [data as PartnerObservation, ...prev]);
    }
  };

  // Disconnect/Revoke partner access immediately
  const disconnectPartner = async () => {
    if (!connection) return;

    if (isDemoMode || !isSupabaseConfigured) {
      localStorage.removeItem(LOCAL_PARTNER_KEY);
      localStorage.removeItem(LOCAL_OBSERVATIONS_KEY);
      setConnection(null);
      setObservations([]);
      return;
    }

    try {
      await supabase.rpc('revoke_partner_connection', {
        p_connection_id: connection.id,
      });
      setConnection(null);
      setObservations([]);
    } catch (err: any) {
      console.error('Error disconnecting partner:', err);
      // Fallback direct update
      await supabase
        .from('partner_connections')
        .update({ status: 'revoked', updated_at: new Date().toISOString() })
        .eq('id', connection.id);
      setConnection(null);
      setObservations([]);
    }
  };

  const isOwner = Boolean(user && connection && connection.owner_id === user.id);
  const isPartner = Boolean(user && connection && connection.partner_id === user.id);

  return {
    connection,
    observations,
    loading,
    error,
    isOwner,
    isPartner,
    createInvite,
    acceptInvite,
    updatePermissions,
    addObservation,
    disconnectPartner,
    refreshPartner: fetchPartnerData,
  };
}
