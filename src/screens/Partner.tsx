import React, { useState } from 'react';
import { usePartner } from '../lib/usePartner';
import { useAuth } from '../lib/AuthContext';
import { Button } from '../components/Button';
import { Toggle } from '../components/Toggle';
import {
  Heart,
  Shield,
  Copy,
  Check,
  UserPlus,
  Lock,
  Eye,
  MessageSquare,
  Send,
  UserX,
} from 'lucide-react';
import { formatDateString } from '../lib/cycleStats';

export const PartnerScreen: React.FC = () => {
  const { user } = useAuth();
  const {
    connection,
    observations,
    isOwner,
    createInvite,
    acceptInvite,
    updatePermissions,
    addObservation,
    disconnectPartner,
  } = usePartner();

  const [inviteInput, setInviteInput] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [newObsText, setNewObsText] = useState('');
  const [obsDate, setObsDate] = useState(() => formatDateString(new Date()));
  const [disconnectModal, setDisconnectModal] = useState(false);

  const handleCopyCode = () => {
    if (connection?.invite_code) {
      navigator.clipboard.writeText(connection.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteInput.trim()) return;
    setAccepting(true);
    setAcceptError(null);
    try {
      const res = await acceptInvite(inviteInput);
      if (!res.success) {
        setAcceptError(res.error || 'Failed to accept invite');
      }
    } catch (err: any) {
      setAcceptError(err.message || 'Error accepting invite');
    } finally {
      setAccepting(false);
    }
  };

  const handleSendObs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObsText.trim()) return;
    try {
      await addObservation(obsDate, newObsText.trim());
      setNewObsText('');
    } catch (err) {
      console.error('Failed to add observation:', err);
    }
  };

  return (
    <div className="pb-24 pt-4 px-4 sm:px-6 max-w-lg mx-auto space-y-6 animate-fade-in">
      <div>
        <span className="text-xs font-semibold tracking-wider uppercase text-terracotta-600">Private Sharing</span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-warm-900 mt-0.5">Partner Mode</h1>
        <p className="text-xs text-warm-600 mt-1">
          Share carefully controlled cycle insights with your trusted partner.
        </p>
      </div>

      <div className="p-4 bg-white rounded-3xl border border-warm-200 shadow-soft flex items-start gap-3 text-xs text-warm-700">
        <Shield className="w-5 h-5 text-terracotta-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-warm-900">Database-Level Security Isolation</span>
          <p>
            Your partner receives only explicitly permitted cues. Private journal notes are never visible to partners.
          </p>
        </div>
      </div>

      {!connection || connection.status === 'revoked' ? (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-warm-200 shadow-card space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-terracotta-50 text-terracotta-600 flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-warm-900">Invite Your Partner</h3>
                <p className="text-xs text-warm-500">Generate a unique invite code to share</p>
              </div>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => createInvite()}
              className="w-full"
              icon={<UserPlus className="w-4 h-4" />}
            >
              Generate Partner Code
            </Button>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-warm-200 shadow-card space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sage-50 text-sage-600 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-warm-900">Connect to Partner</h3>
                <p className="text-xs text-warm-500">Enter a code provided by your partner</p>
              </div>
            </div>

            {acceptError && (
              <div className="p-3 bg-red-50 text-red-800 text-xs rounded-xl border border-red-200">
                {acceptError}
              </div>
            )}

            <form onSubmit={handleAcceptInvite} className="space-y-3">
              <input
                type="text"
                value={inviteInput}
                onChange={e => setInviteInput(e.target.value.toUpperCase())}
                placeholder="CY-ABC123"
                className="w-full min-h-touch px-4 rounded-2xl border border-warm-300 focus:border-terracotta-500 bg-warm-50/50 text-warm-900 text-sm font-mono tracking-wider text-center"
              />
              <Button
                type="submit"
                variant="secondary"
                size="md"
                loading={accepting}
                className="w-full"
              >
                Accept & Link Connection
              </Button>
            </form>
          </div>
        </div>
      ) : connection.status === 'pending' ? (
        <div className="bg-white rounded-3xl p-6 border border-warm-200 shadow-card space-y-5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-terracotta-100 text-terracotta-600 flex items-center justify-center mx-auto">
            <Heart className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-bold text-warm-900">Share This Invite Code</h3>
            <p className="text-xs text-warm-600">
              Have your partner open CYTRACK and enter this code in Partner Mode:
            </p>
          </div>

          <div className="p-4 bg-warm-50 rounded-2xl border border-warm-200 flex items-center justify-between gap-2 max-w-xs mx-auto">
            <span className="font-mono text-lg font-bold text-terracotta-700 tracking-wider">
              {connection.invite_code}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-2 rounded-xl bg-white text-warm-700 hover:text-warm-900 border border-warm-200 shadow-soft"
              aria-label="Copy invite code"
            >
              {copied ? <Check className="w-4 h-4 text-sage-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-[11px] text-warm-500">
            Waiting for partner to accept... (You can configure sharing permissions below in advance)
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 border border-warm-200 shadow-card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sage-100 text-sage-700 flex items-center justify-center">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-sage-700 uppercase tracking-wider">
                  Active Connection
                </span>
                <h3 className="text-sm font-bold text-warm-900">
                  {isOwner ? 'Connected with Partner' : 'Connected to Partner (Shared View)'}
                </h3>
              </div>
            </div>
            <button
              onClick={() => setDisconnectModal(true)}
              className="p-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
            >
              Disconnect
            </button>
          </div>

          {isOwner && connection.permissions && (
            <div className="bg-white rounded-3xl p-6 border border-warm-200 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-warm-100">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-terracotta-500" />
                  <h3 className="text-sm font-semibold text-warm-900">Granular Sharing Permissions</h3>
                </div>
                <span className="text-[11px] text-warm-500">Owner Controls</span>
              </div>

              <div className="space-y-2 divide-y divide-warm-100">
                <Toggle
                  label="Cycle & Period Phases"
                  description="Share current cycle day and estimated period window"
                  checked={connection.permissions.share_cycle}
                  onChange={v => updatePermissions({ share_cycle: v })}
                />
                <Toggle
                  label="Mood & Emotional Tone"
                  description="Share daily logged mood tags"
                  checked={connection.permissions.share_mood}
                  onChange={v => updatePermissions({ share_mood: v })}
                />
                <Toggle
                  label="Energy Levels (1–5)"
                  description="Share daily vitality level"
                  checked={connection.permissions.share_energy}
                  onChange={v => updatePermissions({ share_energy: v })}
                />
                <Toggle
                  label="Physical Symptoms"
                  description="Share symptom names like cramps or fatigue"
                  checked={connection.permissions.share_symptoms}
                  onChange={v => updatePermissions({ share_symptoms: v })}
                />
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl p-6 border border-warm-200 shadow-card space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-terracotta-500" />
              <h3 className="text-sm font-semibold text-warm-900">Partner Care Observations</h3>
            </div>
            <p className="text-xs text-warm-600">
              A dedicated thread for partner check-in notes, support gestures, or care observations.
            </p>

            <form onSubmit={handleSendObs} className="space-y-3 pt-2">
              <div className="flex gap-2">
                <input
                  type="date"
                  value={obsDate}
                  onChange={e => setObsDate(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl border border-warm-300 bg-warm-50 text-warm-900"
                />
                <input
                  type="text"
                  value={newObsText}
                  onChange={e => setNewObsText(e.target.value)}
                  placeholder="e.g. Prepared warm tea and heating pad..."
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-warm-300 bg-warm-50 text-warm-900 focus:border-terracotta-500"
                />
                <Button type="submit" variant="primary" size="sm" icon={<Send className="w-3.5 h-3.5" />}>
                  Post
                </Button>
              </div>
            </form>

            <div className="space-y-2 pt-3">
              {observations.length === 0 ? (
                <p className="text-xs text-warm-400 italic text-center py-2">
                  No observations added yet.
                </p>
              ) : (
                observations.map(obs => (
                  <div key={obs.id} className="p-3 bg-warm-50 rounded-2xl border border-warm-200 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-warm-500 font-medium">
                      <span>{obs.log_date}</span>
                      <span>{obs.author_id === user?.id ? 'You' : 'Partner'}</span>
                    </div>
                    <p className="text-warm-800">{obs.observation}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {disconnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-warm-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 border border-warm-200 shadow-card max-w-sm w-full space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <UserX className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-bold text-warm-900">Disconnect Partner?</h3>
              <p className="text-xs text-warm-600">
                Partner access will be immediately cut off at the database level.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={() => setDisconnectModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={async () => {
                  await disconnectPartner();
                  setDisconnectModal(false);
                }}
                className="flex-1"
              >
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
