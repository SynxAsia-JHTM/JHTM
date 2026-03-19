import React, { useEffect, useState } from 'react';
import {
  Settings2,
  Building2,
  Users,
  ClipboardCheck,
  Heart,
  Calendar,
  Bell,
  Palette,
  HelpCircle,
  Save,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import {
  useSettingsStore,
  type SystemSettings,
  type UserManagementUser,
} from '@/stores/settingsStore';
import { useToast } from '@/components/ui/useToast';
import { cn } from '@/lib/utils';
import Modal from '@/components/ui/Modal';

type Tab =
  | 'church'
  | 'users'
  | 'attendance'
  | 'prayer'
  | 'events'
  | 'notifications'
  | 'appearance'
  | 'help';

export default function Settings() {
  const toast = useToast();
  const { settings, hasLoadedSettings, loadSettings, updateSettings } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<Tab>('church');
  const [formData, setFormData] = useState<Partial<SystemSettings>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (key: keyof SystemSettings, value: SystemSettings[keyof SystemSettings]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const ok = await updateSettings(formData);
      if (ok) {
        toast.success('Settings saved', 'Your changes have been successfully applied.');
      } else {
        toast.error('Save failed', 'Unable to update settings.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!hasLoadedSettings) {
    return <div className="p-8 text-center text-sm text-slate-500">Loading settings...</div>;
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'church', label: 'Church Information', icon: Building2 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
    { id: 'prayer', label: 'Prayer Requests', icon: Heart },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
  ];

  return (
    <div className="space-y-6 pb-20">
      <div className="rounded-2xl bg-gradient-to-br from-navy via-sea to-cream p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold">Settings</h1>
            <p className="mt-1 text-sm font-semibold text-white/85">
              Manage system configuration and administrators.
            </p>
          </div>
          <div className="rounded-2xl bg-white/15 p-3 ring-1 ring-white/20">
            <Settings2 size={22} aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 shrink-0">
          <nav className="flex flex-row overflow-x-auto lg:flex-col lg:space-y-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors',
                  activeTab === tab.id
                    ? 'bg-sky-100 text-navy'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'users' ? (
            <UserManagementSection />
          ) : activeTab === 'help' ? (
            <HelpSection />
          ) : activeTab === 'appearance' ? (
            <AppearanceSection
              formData={formData}
              onChange={handleChange}
              onSave={handleSave}
              isSaving={isSaving}
            />
          ) : (
            <form onSubmit={handleSave} className="jhtm-card p-6">
              <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">
                  {tabs.find((t) => t.id === activeTab)?.label}
                </h2>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={cn('jhtm-btn jhtm-btn-primary', isSaving && 'animate-pulse')}
                >
                  <Save size={18} />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              {activeTab === 'church' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">
                      Church Name
                    </label>
                    <input
                      type="text"
                      value={formData.church_name || ''}
                      onChange={(e) => handleChange('church_name', e.target.value)}
                      className="jhtm-input mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Address</label>
                    <input
                      type="text"
                      value={formData.church_address || ''}
                      onChange={(e) => handleChange('church_address', e.target.value)}
                      className="jhtm-input mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">
                        Contact Number
                      </label>
                      <input
                        type="text"
                        value={formData.church_contact || ''}
                        onChange={(e) => handleChange('church_contact', e.target.value)}
                        className="jhtm-input mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.church_email || ''}
                        onChange={(e) => handleChange('church_email', e.target.value)}
                        className="jhtm-input mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'attendance' && (
                <div className="space-y-6">
                  <label className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                    <div>
                      <span className="block font-semibold text-slate-900">Enable QR Check-in</span>
                      <span className="text-sm text-slate-500">
                        Allow members to check in via QR code
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.attendance_enable_qr || false}
                      onChange={(e) => handleChange('attendance_enable_qr', e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 text-navy focus:ring-sea-500"
                    />
                  </label>
                  <label className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                    <div>
                      <span className="block font-semibold text-slate-900">
                        Allow Guest Attendance
                      </span>
                      <span className="text-sm text-slate-500">
                        Guests can check in without an account
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.attendance_allow_guest || false}
                      onChange={(e) => handleChange('attendance_allow_guest', e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 text-navy focus:ring-sea-500"
                    />
                  </label>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">
                      Check-in Time Window (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.attendance_time_window || 120}
                      onChange={(e) =>
                        handleChange('attendance_time_window', parseInt(e.target.value))
                      }
                      className="jhtm-input mt-1 w-32"
                      min="0"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'prayer' && (
                <div className="space-y-6">
                  <label className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                    <div>
                      <span className="block font-semibold text-slate-900">
                        Allow Anonymous Requests
                      </span>
                      <span className="text-sm text-slate-500">
                        Members can submit prayers without their name
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.prayer_allow_anonymous || false}
                      onChange={(e) => handleChange('prayer_allow_anonymous', e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 text-navy focus:ring-sea-500"
                    />
                  </label>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">
                      Default Visibility
                    </label>
                    <select
                      value={formData.prayer_default_visibility || 'leaders'}
                      onChange={(e) => handleChange('prayer_default_visibility', e.target.value)}
                      className="jhtm-input mt-1 w-full sm:w-64"
                    >
                      <option value="private">Private</option>
                      <option value="leaders">Leaders Only</option>
                      <option value="public">Public</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'events' && (
                <div className="space-y-6">
                  <label className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                    <div>
                      <span className="block font-semibold text-slate-900">
                        Enable Event Registration
                      </span>
                      <span className="text-sm text-slate-500">
                        Allow members to register for events
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.event_enable_registration || false}
                      onChange={(e) => handleChange('event_enable_registration', e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 text-navy focus:ring-sea-500"
                    />
                  </label>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">
                      Default Max Slots per Event
                    </label>
                    <input
                      type="number"
                      value={formData.event_default_max_slots || 100}
                      onChange={(e) =>
                        handleChange('event_default_max_slots', parseInt(e.target.value))
                      }
                      className="jhtm-input mt-1 w-32"
                      min="0"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <label className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                    <div>
                      <span className="block font-semibold text-slate-900">Email Alerts</span>
                      <span className="text-sm text-slate-500">
                        Send important updates via email
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.notification_email_alerts || false}
                      onChange={(e) => handleChange('notification_email_alerts', e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 text-navy focus:ring-sea-500"
                    />
                  </label>
                  <label className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                    <div>
                      <span className="block font-semibold text-slate-900">In-App Alerts</span>
                      <span className="text-sm text-slate-500">
                        Show notifications inside the portal
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.notification_in_app_alerts || false}
                      onChange={(e) => handleChange('notification_in_app_alerts', e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 text-navy focus:ring-sea-500"
                    />
                  </label>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function AppearanceSection({
  formData,
  onChange,
  onSave,
  isSaving,
}: {
  formData: Partial<SystemSettings>;
  onChange: (key: keyof SystemSettings, value: SystemSettings[keyof SystemSettings]) => void;
  onSave: (e: React.FormEvent) => void;
  isSaving: boolean;
}) {
  return (
    <form onSubmit={onSave} className="jhtm-card p-6">
      <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900">Appearance</h2>
        <button
          type="submit"
          disabled={isSaving}
          className={cn('jhtm-btn jhtm-btn-primary', isSaving && 'animate-pulse')}
        >
          <Save size={18} />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700">Theme Preference</label>
          <select
            value={formData.appearance_theme || 'light'}
            onChange={(e) => onChange('appearance_theme', e.target.value)}
            className="jhtm-input mt-1 w-full sm:w-64"
          >
            <option value="light">Light Mode</option>
            <option value="dark">Dark Mode (Beta)</option>
            <option value="system">System Default</option>
          </select>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-900">Color Palette</p>
          <p className="mt-1 text-sm text-slate-600">The current JHTM theme colors.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="h-12 rounded-xl bg-[#355872]" title="Navy (#355872)" />
            <div className="h-12 rounded-xl bg-[#7AAACE]" title="Sea (#7AAACE)" />
            <div className="h-12 rounded-xl bg-[#9CD5FF]" title="Sky (#9CD5FF)" />
            <div
              className="h-12 rounded-xl border border-slate-200 bg-[#F7F8F0]"
              title="Cream (#F7F8F0)"
            />
          </div>
        </div>
      </div>
    </form>
  );
}

function HelpSection() {
  return (
    <div className="jhtm-card p-6">
      <h2 className="mb-4 border-b border-slate-100 pb-4 text-lg font-bold text-slate-900">
        Help & Support
      </h2>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Welcome to the JHTM Church Management System. Here you can find resources to help you
          manage your church effectively.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button className="jhtm-btn jhtm-btn-secondary">
            View Documentation
            <ExternalLink size={16} />
          </button>
          <button className="jhtm-btn jhtm-btn-ghost border border-slate-200">
            Contact Support
          </button>
        </div>
        <div className="mt-8 rounded-xl bg-sky-50 p-4">
          <p className="text-sm font-semibold text-navy">System Information</p>
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            <li>Version: 1.0.0</li>
            <li>Environment: Production</li>
            <li>Database: Connected</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function UserManagementSection() {
  const toast = useToast();
  const { users, loadUsers, createUser, updateUser, deleteUser } = useSettingsStore();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isStaff, setIsStaff] = useState(false);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const resetForm = () => {
    setEditId(null);
    setEmail('');
    setPassword('');
    setIsStaff(false);
    setIsSuperuser(false);
  };

  const handleOpenAdd = () => {
    resetForm();
    setOpen(true);
  };

  const handleOpenEdit = (u: UserManagementUser) => {
    setEditId(u.id);
    setEmail(u.email);
    setPassword('');
    setIsStaff(u.is_staff);
    setIsSuperuser(u.is_superuser);
    setOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: Partial<UserManagementUser> & { password?: string } = {
        email,
        is_staff: isStaff,
        is_superuser: isSuperuser,
      };
      if (password) payload.password = password;

      let ok = false;
      if (editId) {
        ok = await updateUser(editId, payload);
      } else {
        ok = await createUser(payload);
      }

      if (ok) {
        toast.success('Success', editId ? 'User updated.' : 'User created.');
        setOpen(false);
        resetForm();
      } else {
        toast.error('Error', 'Unable to save user.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this user?')) return;
    const ok = await deleteUser(id);
    if (ok) {
      toast.success('Deleted', 'User has been removed.');
    } else {
      toast.error('Error', 'Unable to delete user.');
    }
  };

  return (
    <div className="jhtm-card p-6">
      <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">User Management</h2>
          <p className="mt-1 text-sm text-slate-500">Manage admin and staff accounts.</p>
        </div>
        <button onClick={handleOpenAdd} className="jhtm-btn jhtm-btn-primary">
          <Plus size={18} />
          Add User
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="pb-3 font-semibold">Email</th>
              <th className="pb-3 font-semibold">Roles</th>
              <th className="pb-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="transition-colors hover:bg-slate-50/50">
                <td className="py-4 font-medium text-slate-900">{u.email}</td>
                <td className="py-4">
                  <div className="flex gap-2">
                    {u.is_superuser && (
                      <span className="jhtm-pill bg-sky-100 text-navy">Superuser</span>
                    )}
                    {u.is_staff && !u.is_superuser && (
                      <span className="jhtm-pill bg-slate-100 text-slate-700">Staff</span>
                    )}
                    {!u.is_superuser && !u.is_staff && (
                      <span className="jhtm-pill border-dashed">Member</span>
                    )}
                  </div>
                </td>
                <td className="py-4 text-right">
                  <button
                    onClick={() => handleOpenEdit(u)}
                    className="mr-2 inline-flex p-2 text-slate-400 hover:text-navy"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="inline-flex p-2 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-slate-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} onOpenChange={setOpen} title={editId ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="jhtm-input mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700">
              {editId ? 'New Password (optional)' : 'Password'}
            </label>
            <input
              type="password"
              required={!editId}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="jhtm-input mt-1"
            />
          </div>
          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isStaff}
                onChange={(e) => setIsStaff(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-navy focus:ring-sea-500"
              />
              <span className="text-sm font-semibold text-slate-700">Staff Access</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isSuperuser}
                onChange={(e) => setIsSuperuser(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-navy focus:ring-sea-500"
              />
              <span className="text-sm font-semibold text-slate-700">Superuser Access</span>
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="jhtm-btn jhtm-btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={cn('jhtm-btn jhtm-btn-primary', isSaving && 'animate-pulse')}
            >
              {isSaving ? 'Saving...' : 'Save User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
