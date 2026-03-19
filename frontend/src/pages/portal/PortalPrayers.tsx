import React, { useState } from 'react';
import { Heart, Plus, Send, Clock, CheckCircle, MessageCircle } from 'lucide-react';

type PrayerRequest = {
  id: string;
  request: string;
  date: string;
  status: 'Pending' | 'In Progress' | 'Answered';
  isAnonymous: boolean;
  prayers: number;
};

const initialPrayers: PrayerRequest[] = [
  {
    id: '1',
    request: 'Please pray for my job interview next week. I have been seeking a new opportunity for months.',
    date: 'March 18, 2026',
    status: 'Pending',
    isAnonymous: false,
    prayers: 5,
  },
  {
    id: '2',
    request: 'Pray for my family during this difficult time. My parents are going through health challenges.',
    date: 'March 10, 2026',
    status: 'In Progress',
    isAnonymous: false,
    prayers: 12,
  },
  {
    id: '3',
    request: "Thank you for prayers for my daughter's recovery. She is doing much better now!",
    date: 'Feb 28, 2026',
    status: 'Answered',
    isAnonymous: false,
    prayers: 24,
  },
];

export default function PortalPrayers() {
  const [prayers, setPrayers] = useState<PrayerRequest[]>(initialPrayers);
  const [showForm, setShowForm] = useState(false);
   const [newRequest, setNewRequest] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.trim()) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const prayer: PrayerRequest = {
      id: Date.now().toString(),
      request: newRequest,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      status: 'Pending',
      isAnonymous,
      prayers: 0,
    };

    setPrayers([prayer, ...prayers]);
    setNewRequest('');
    setIsAnonymous(false);
    setShowForm(false);
    setIsSubmitting(false);
  };

  const handlePray = (id: string) => {
    setPrayers(prev => prev.map(p => 
      p.id === id ? { ...p, prayers: p.prayers + 1 } : p
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-100 text-amber-700';
      case 'In Progress':
        return 'bg-blue-100 text-blue-700';
      case 'Answered':
        return 'bg-emerald-100 text-emerald-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock size={14} />;
      case 'In Progress':
        return <Heart size={14} />;
      case 'Answered':
        return <CheckCircle size={14} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Prayer Requests</h1>
          <p className="mt-1 text-slate-500">Share your prayer needs with our church family</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          New Prayer Request
        </button>
      </div>

      {/* New Prayer Request Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900">Submit Prayer Request</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Your Prayer Request
                </label>
                <textarea
                  value={newRequest}
                  onChange={(e) => setNewRequest(e.target.value)}
                  rows={4}
                  placeholder="Share your prayer request with us..."
                  className="mt-2 w-full rounded-xl border border-slate-200 p-4 text-slate-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                />
                <span className="text-sm text-slate-600">Submit anonymously</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newRequest.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send size={18} />
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prayer Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Total Requests</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{prayers.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Pending</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {prayers.filter(p => p.status === 'Pending').length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Answered</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {prayers.filter(p => p.status === 'Answered').length}
          </p>
        </div>
      </div>

      {/* Prayer Requests List */}
      <div className="space-y-4">
        {prayers.map((prayer) => (
          <div
            key={prayer.id}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(
                      prayer.status
                    )}`}
                  >
                    {getStatusIcon(prayer.status)}
                    {prayer.status}
                  </span>
                  {prayer.isAnonymous && (
                    <span className="text-xs text-slate-400">Anonymous</span>
                  )}
                </div>
                <p className="mt-3 text-slate-900">{prayer.request}</p>
                <p className="mt-3 text-sm text-slate-500">{prayer.date}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-4">
              <button
                onClick={() => handlePray(prayer.id)}
                className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-purple-600"
              >
                <Heart size={18} className="hover:fill-purple-600" />
                Prayed {prayer.prayers > 0 && `(${prayer.prayers})`}
              </button>
              <button className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600">
                <MessageCircle size={18} />
                Comment
              </button>
            </div>
          </div>
        ))}
      </div>

      {prayers.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Heart className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">No Prayer Requests</h3>
          <p className="mt-2 text-slate-500">You haven't submitted any prayer requests yet.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Submit Your First Request
          </button>
        </div>
      )}
    </div>
  );
}
