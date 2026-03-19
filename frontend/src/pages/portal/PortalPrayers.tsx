import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EyeOff, Eye, Users, Heart } from 'lucide-react';

import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/useToast';
import { cn } from '@/lib/utils';
import {
  type PrayerRequest,
  type PrayerVisibility,
  usePrayerRequestsStore,
} from '@/stores/prayerRequestsStore';

export default function PortalPrayers() {
  const toast = useToast();
  const loadMyRequests = usePrayerRequestsStore((s) => s.loadMyRequests);
  const submitMyRequest = usePrayerRequestsStore((s) => s.submitMyRequest);
  const myRequests = usePrayerRequestsStore((s) => s.myRequests);

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [visibility, setVisibility] = useState<PrayerVisibility>('private');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const messageRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    void loadMyRequests();
  }, [loadMyRequests]);

  const canSubmit = message.trim().length > 0 && !isSubmitting;

  const resetForm = () => {
    setMessage('');
    setVisibility('private');
    setIsAnonymous(false);
    setIsSubmitting(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await submitMyRequest({ message, visibility, isAnonymous });
      toast.success('Prayer shared', 'Your request is now visible on your dashboard.');
      setOpen(false);
      window.setTimeout(() => resetForm(), 0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const summary = useMemo(() => {
    return {
      total: myRequests.length,
      latest: myRequests[0] ?? null,
    };
  }, [myRequests]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Prayer Requests</h1>
          <p className="mt-1 text-slate-500">Share your prayer needs with our church family</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="jhtm-btn jhtm-btn-primary h-11 px-5"
        >
          Share a Prayer 🙏
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="jhtm-card p-5">
          <p className="text-sm font-semibold text-slate-500">Total requests</p>
          <p className="mt-1 text-2xl font-extrabold text-navy">{summary.total}</p>
        </div>
        <div className="jhtm-card p-5">
          <p className="text-sm font-semibold text-slate-500">Latest</p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-900">
            {summary.latest ? summary.latest.message : '—'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {myRequests.length === 0 ? (
          <div className="jhtm-card p-12 text-center">
            <Heart className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No Prayer Requests</h3>
            <p className="mt-2 text-slate-500">
              Share a prayer request and it will appear instantly.
            </p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="jhtm-btn jhtm-btn-primary mt-4"
            >
              Share a Prayer 🙏
            </button>
          </div>
        ) : (
          myRequests.map((prayer) => <PrayerCard key={prayer.id} prayer={prayer} />)
        )}
      </div>

      <Modal
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) window.setTimeout(() => resetForm(), 0);
        }}
        title="Share a Prayer"
        description="Your request will be saved as Submitted and visible on your dashboard immediately."
        initialFocusRef={messageRef}
        className="max-w-2xl"
      >
        <form className="space-y-5" onSubmit={submit}>
          <div className="space-y-2">
            <label htmlFor="prayer-message" className="block text-sm font-semibold text-slate-700">
              Message *
            </label>
            <textarea
              ref={messageRef}
              id="prayer-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="How can we pray for you?"
              className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sea-300 focus:ring-2 focus:ring-sky-100"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="prayer-visibility"
                className="block text-sm font-semibold text-slate-700"
              >
                Visibility
              </label>
              <select
                id="prayer-visibility"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as PrayerVisibility)}
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
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-slate-300 text-navy focus:ring-sea-500"
              />
              <span className="text-sm font-semibold text-slate-700">Submit anonymously</span>
            </label>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="jhtm-btn jhtm-btn-ghost h-11"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={cn('jhtm-btn jhtm-btn-primary h-11', isSubmitting && 'animate-pulse')}
            >
              {isSubmitting ? 'Sharing…' : 'Share a Prayer 🙏'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function PrayerCard({ prayer }: { prayer: PrayerRequest }) {
  const badge =
    prayer.visibility === 'private'
      ? 'bg-slate-100 text-slate-700'
      : prayer.visibility === 'leaders'
        ? 'bg-sky-100 text-navy'
        : 'bg-emerald-100 text-emerald-700';

  const visibilityText =
    prayer.visibility === 'private'
      ? 'Private'
      : prayer.visibility === 'leaders'
        ? 'Leaders Only'
        : 'Public';

  return (
    <div className="jhtm-card p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
          Submitted
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
            badge
          )}
        >
          {visibilityIcon(prayer.visibility)}
          {visibilityText}
        </span>
        {prayer.isAnonymous ? (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            Anonymous
          </span>
        ) : null}
      </div>

      <p className="mt-4 whitespace-pre-wrap text-sm text-slate-900">{prayer.message}</p>
      <p className="mt-4 text-xs font-semibold text-slate-500">
        {new Date(prayer.createdAt).toLocaleString()}
      </p>
    </div>
  );
}

function visibilityIcon(visibility: PrayerVisibility) {
  if (visibility === 'private') return <EyeOff size={14} aria-hidden="true" />;
  if (visibility === 'leaders') return <Users size={14} aria-hidden="true" />;
  return <Eye size={14} aria-hidden="true" />;
}
