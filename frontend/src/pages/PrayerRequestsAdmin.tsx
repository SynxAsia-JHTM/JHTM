import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Edit2, HeartHandshake, RefreshCcw, Search, Trash2 } from 'lucide-react';

import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/useToast';
import { cn } from '@/lib/utils';
import { usePrayerRequestsStore } from '@/stores/prayerRequestsStore';

export default function PrayerRequestsAdmin() {
  const toast = useToast();
  const loadAdminRequests = usePrayerRequestsStore((s) => s.loadAdminRequests);
  const adminRequests = usePrayerRequestsStore((s) => s.adminRequests);
  const patchAdminRequest = usePrayerRequestsStore((s) => s.patchAdminRequest);
  const deleteAdminRequest = usePrayerRequestsStore((s) => s.deleteAdminRequest);

  const [query, setQuery] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<
    'all' | 'private' | 'leaders' | 'public'
  >('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const editMessageRef = useRef<HTMLTextAreaElement | null>(null);
  const [editMessage, setEditMessage] = useState('');
  const [editVisibility, setEditVisibility] = useState<'private' | 'leaders' | 'public'>('private');
  const [editAnonymous, setEditAnonymous] = useState(false);

  useEffect(() => {
    void loadAdminRequests();
  }, [loadAdminRequests]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadAdminRequests({ force: true });
    }, 15000);
    return () => window.clearInterval(interval);
  }, [loadAdminRequests]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const fromTs = dateFrom ? new Date(dateFrom).getTime() : null;
    const toTs = dateTo ? new Date(`${dateTo}T23:59:59.999Z`).getTime() : null;

    return adminRequests.filter((r) => {
      if (visibilityFilter !== 'all' && r.visibility !== visibilityFilter) return false;

      if (fromTs !== null || toTs !== null) {
        const ts = r.createdAt ? new Date(r.createdAt).getTime() : null;
        if (ts === null) return false;
        if (fromTs !== null && ts < fromTs) return false;
        if (toTs !== null && ts > toTs) return false;
      }

      if (!normalized) return true;

      const hay = [
        r.isAnonymous ? 'anonymous' : '',
        r.userEmail ?? '',
        String(r.userId),
        r.message,
        r.visibility,
      ]
        .join(' ')
        .toLowerCase();

      return hay.includes(normalized);
    });
  }, [adminRequests, dateFrom, dateTo, query, visibilityFilter]);

  const openEdit = (id: string) => {
    const item = adminRequests.find((r) => r.id === id);
    if (!item) return;
    setEditId(id);
    setEditMessage(item.message);
    setEditVisibility(item.visibility);
    setEditAnonymous(item.isAnonymous);
  };

  const closeEdit = () => {
    setEditId(null);
    setIsSaving(false);
  };

  const closeDelete = () => {
    setDeleteId(null);
    setIsDeleting(false);
  };

  const onSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    const trimmed = editMessage.trim();
    if (!trimmed) return;

    setIsSaving(true);
    try {
      const updated = await patchAdminRequest(editId, {
        message: trimmed,
        visibility: editVisibility,
        isAnonymous: editAnonymous,
      });
      if (!updated) {
        toast.error('Update failed', 'Unable to save changes.');
        return;
      }
      toast.success('Updated', 'Prayer request updated.');
      closeEdit();
      void loadAdminRequests({ force: true });
    } finally {
      setIsSaving(false);
    }
  };

  const onConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const ok = await deleteAdminRequest(deleteId);
      if (!ok) {
        toast.error('Delete failed', 'Unable to delete this request.');
        return;
      }
      toast.success('Deleted', 'Prayer request removed.');
      closeDelete();
      void loadAdminRequests({ force: true });
    } finally {
      setIsDeleting(false);
    }
  };

  const summary = useMemo(() => {
    return {
      total: adminRequests.length,
      anonymous: adminRequests.filter((r) => r.isAnonymous).length,
      publicCount: adminRequests.filter((r) => r.visibility === 'public').length,
    };
  }, [adminRequests]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-navy via-sea to-cream p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold">Prayer Requests</h1>
            <p className="mt-1 text-sm font-semibold text-white/85">
              Oversight for all submissions.
            </p>
          </div>
          <div className="rounded-2xl bg-white/15 p-3 ring-1 ring-white/20">
            <HeartHandshake size={22} aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="jhtm-card p-5">
          <p className="text-sm font-semibold text-slate-500">Total</p>
          <p className="mt-1 text-2xl font-extrabold text-navy">{summary.total}</p>
        </div>
        <div className="jhtm-card p-5">
          <p className="text-sm font-semibold text-slate-500">Anonymous</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{summary.anonymous}</p>
        </div>
        <div className="jhtm-card p-5">
          <p className="text-sm font-semibold text-slate-500">Public</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-700">{summary.publicCount}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">All Submissions</h2>
              <p className="mt-1 text-sm text-slate-500">Newest first. No approval required.</p>
            </div>

            <button
              type="button"
              onClick={() => loadAdminRequests({ force: true })}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-500 focus-visible:ring-offset-2"
            >
              <RefreshCcw size={18} aria-hidden="true" />
              Refresh
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="relative lg:col-span-6">
              <Search
                size={18}
                aria-hidden="true"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
                type="search"
                placeholder="Search by member, message, visibility..."
                aria-label="Search prayer requests"
              />
            </div>

            <div className="lg:col-span-2">
              <select
                value={visibilityFilter}
                onChange={(e) =>
                  setVisibilityFilter(e.target.value as 'all' | 'private' | 'leaders' | 'public')
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
                aria-label="Filter by visibility"
              >
                <option value="all">All visibility</option>
                <option value="private">Private</option>
                <option value="leaders">Leaders Only</option>
                <option value="public">Public</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
                aria-label="Filter from date"
              />
            </div>

            <div className="lg:col-span-2">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
                aria-label="Filter to date"
              />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No prayer requests yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/60">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Member
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Visibility
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Message
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Submitted
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        Submitted
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900">
                        {r.isAnonymous ? 'Anonymous' : (r.userEmail ?? `User ${r.userId}`)}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">ID: {r.userId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {r.visibility === 'private'
                          ? 'Private'
                          : r.visibility === 'leaders'
                            ? 'Leaders Only'
                            : 'Public'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="max-w-[42rem] whitespace-pre-wrap text-sm text-slate-900">
                        {r.message}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700">
                        {r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(r.id)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-500 focus-visible:ring-offset-2"
                          aria-label="Edit prayer request"
                        >
                          <Edit2 size={18} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(r.id)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-500 focus-visible:ring-offset-2"
                          aria-label="Delete prayer request"
                        >
                          <Trash2 size={18} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={editId !== null}
        onOpenChange={(next) => {
          if (!next) closeEdit();
        }}
        title="Edit prayer request"
        description="Changes are saved immediately."
        initialFocusRef={editMessageRef}
        className="max-w-2xl"
      >
        <form className="space-y-5" onSubmit={onSaveEdit}>
          <div className="space-y-2">
            <label
              htmlFor="admin-prayer-message"
              className="block text-sm font-semibold text-slate-700"
            >
              Message
            </label>
            <textarea
              id="admin-prayer-message"
              ref={editMessageRef}
              value={editMessage}
              onChange={(e) => setEditMessage(e.target.value)}
              rows={6}
              className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sea-300 focus:ring-2 focus:ring-sky-100"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="admin-prayer-visibility"
                className="block text-sm font-semibold text-slate-700"
              >
                Visibility
              </label>
              <select
                id="admin-prayer-visibility"
                value={editVisibility}
                onChange={(e) =>
                  setEditVisibility(e.target.value as 'private' | 'leaders' | 'public')
                }
                className="jhtm-input h-11"
              >
                <option value="private">Private</option>
                <option value="leaders">Leaders Only</option>
                <option value="public">Public</option>
              </select>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <input
                type="checkbox"
                checked={editAnonymous}
                onChange={(e) => setEditAnonymous(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-slate-300 text-navy focus:ring-sea-500"
              />
              <span className="text-sm font-semibold text-slate-700">Anonymous</span>
            </label>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={closeEdit} className="jhtm-btn jhtm-btn-ghost h-11">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || editMessage.trim().length === 0}
              className={cn('jhtm-btn jhtm-btn-primary h-11', isSaving && 'animate-pulse')}
            >
              {isSaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleteId !== null}
        onOpenChange={(next) => {
          if (!next) closeDelete();
        }}
        title="Delete prayer request?"
        description="This action cannot be undone."
        className="max-w-lg"
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">Status: Submitted</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-900">
              {deleteId ? adminRequests.find((r) => r.id === deleteId)?.message : ''}
            </p>
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={closeDelete} className="jhtm-btn jhtm-btn-ghost h-11">
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirmDelete}
              disabled={isDeleting}
              className={cn(
                'inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-red-600/60',
                isDeleting && 'animate-pulse'
              )}
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
