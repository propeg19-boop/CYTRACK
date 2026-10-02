import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/ThemeContext';
import { exportUserData } from '../lib/exportData';
import { requestPushPermission } from '../lib/push';
import { supabase, isSupabaseConfigured, supabaseUrl } from '../lib/supabase';
import { Button } from '../components/Button';
import { Toggle } from '../components/Toggle';
import { Modal } from '../components/Modal';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import {
  User,
  Bell,
  Heart,
  Download,
  Trash2,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import { ScreenTab } from '../components/BottomNav';

interface SettingsProps {
  onNavigate: (tab: ScreenTab) => void;
  onOpenPartner: () => void;
}

export const SettingsScreen: React.FC<SettingsProps> = ({ onOpenPartner }) => {
  const { user, profile, updateProfile, signOut, isDemoMode } = useAuth();
  const { theme } = useTheme();
  const c = theme.colors;
  const [reminders, setReminders] = useState<boolean>(profile?.reminder_enabled ?? false);
  const [exporting, setExporting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleReminderToggle = async (enabled: boolean) => {
    setReminders(enabled);
    if (enabled && user) {
      await requestPushPermission(user.id);
    }
    await updateProfile({ reminder_enabled: enabled });
  };

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      await exportUserData(user);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE' || !user) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      if (isDemoMode || !isSupabaseConfigured) {
        localStorage.clear();
        await signOut();
        return;
      }

      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch(`${supabaseUrl}/functions/v1/delete-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ confirmation: 'DELETE' }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete account');
      }

      await signOut();
    } catch (err: any) {
      setDeleteError(err.message || 'Account deletion failed');
    } finally {
      setDeleting(false);
    }
  };

  const cardStyle = {
    background: c.cardBg,
    border: `1px solid ${c.cardBorder}`,
    boxShadow: `0 8px 30px -4px ${c.shadowColor}`,
  };

  const cardSoftStyle = {
    background: c.cardBg,
    border: `1px solid ${c.cardBorder}`,
    boxShadow: `0 4px 20px -2px ${c.shadowColor}`,
  };

  return (
    <div className="pb-24 pt-4 px-4 sm:px-6 max-w-lg mx-auto space-y-6 animate-fade-in relative z-10">
      <div>
        <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: c.primary }}>Preferences</span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold mt-0.5" style={{ color: c.text }}>Settings</h1>
      </div>

      {/* Profile Card */}
      <div className="rounded-3xl p-5 flex items-center justify-between" style={cardSoftStyle}>
        <div className="flex items-center gap-3.5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: c.bgSecondary, color: c.textMuted }}
          >
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: c.text }}>{user?.email || 'CYTRACK User'}</h2>
            <p className="text-xs" style={{ color: c.textMuted }}>
              {isDemoMode ? 'Local Demo Account' : 'Authenticated Profile'}
            </p>
          </div>
        </div>
      </div>

      {/* ─── THEME SWITCHER ─── */}
      <ThemeSwitcher />

      {/* Notifications */}
      <div className="rounded-3xl p-6 space-y-4" style={cardStyle}>
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4" style={{ color: c.primary }} />
          <h2 className="text-sm font-semibold" style={{ color: c.text }}>Notifications & Reminders</h2>
        </div>
        <div className="space-y-3">
          <Toggle
            label="Approaching Period Reminder"
            description="Receive gentle Web Push 2 days before your estimated period window"
            checked={reminders}
            onChange={handleReminderToggle}
          />
        </div>
      </div>

      {/* Partner Sharing */}
      <div className="rounded-3xl p-6 space-y-3" style={cardStyle}>
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4" style={{ color: c.primary }} />
          <h2 className="text-sm font-semibold" style={{ color: c.text }}>Partner Sharing Mode</h2>
        </div>
        <p className="text-xs" style={{ color: c.textMuted }}>
          Invite a partner or manage granular permission controls for what they see.
        </p>
        <Button variant="secondary" size="md" onClick={onOpenPartner} className="w-full">
          Open Partner Controls
        </Button>
      </div>

      {/* Export Data */}
      <div className="rounded-3xl p-6 space-y-3" style={cardStyle}>
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4" style={{ color: c.primary }} />
          <h2 className="text-sm font-semibold" style={{ color: c.text }}>Export Personal Data</h2>
        </div>
        <p className="text-xs" style={{ color: c.textMuted }}>
          Download a complete JSON copy of your cycles, symptoms, mood history, and settings.
        </p>
        <Button
          variant="outline"
          size="md"
          loading={exporting}
          onClick={handleExport}
          className="w-full"
          icon={<Download className="w-4 h-4" />}
        >
          Export Data (.JSON)
        </Button>
      </div>

      {/* Account Actions */}
      <div className="rounded-3xl p-6 space-y-3" style={cardStyle}>
        <h2 className="text-sm font-semibold" style={{ color: c.text }}>Account Actions</h2>
        <div className="space-y-2 pt-1">
          <Button
            variant="ghost"
            size="md"
            onClick={signOut}
            className="w-full justify-start"
            icon={<LogOut className="w-4 h-4" />}
          >
            Sign Out
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={() => setDeleteModalOpen(true)}
            className="w-full justify-start"
            icon={<Trash2 className="w-4 h-4" />}
            style={{ color: c.dangerText }}
          >
            Delete Account Permanently
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center space-y-1 text-[11px] pt-2" style={{ color: c.textMuted }}>
        <p>CYTRACK v1.0.0 — Private & Deterministic Cycle Tracker</p>
        <p>Not medical advice. For informational & wellness tracking purposes only.</p>
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Account Permanently"
      >
        <div className="space-y-4">
          <div
            className="p-4 text-xs rounded-2xl space-y-1.5"
            style={{
              background: c.dangerBg,
              color: c.dangerText,
              border: `1px solid ${c.dangerText}30`,
            }}
          >
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Irreversible Action</span>
            </div>
            <p>
              Deleting your account will permanently wipe your profile, all historical cycle records, daily logs, partner connections, and push subscriptions.
            </p>
          </div>

          {deleteError && (
            <div
              className="p-3 text-xs rounded-xl"
              style={{ background: c.dangerBg, color: c.dangerText }}
            >
              {deleteError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-medium" style={{ color: c.text }}>
              Type <span className="font-mono font-bold" style={{ color: c.dangerText }}>DELETE</span> to confirm:
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full min-h-touch px-4 rounded-2xl text-sm font-mono cy-input"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setDeleteModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              disabled={deleteConfirmText !== 'DELETE'}
              loading={deleting}
              onClick={handleDeleteAccount}
              className="flex-1"
            >
              Permanently Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
