import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, ClipboardCheck, Heart, Calendar, User } from 'lucide-react';

export default function PortalDashboard() {
  const navigate = useNavigate();

  // Mock member data - in real app, this would come from API
  const memberName = 'John Smith';
  const upcomingServices = [
    { id: 1, name: 'Sunday Worship', date: 'March 23, 2026', time: '9:00 AM' },
    { id: 2, name: 'Prayer Meeting', date: 'March 25, 2026', time: '7:00 PM' },
  ];

  const stats = [
    {
      label: 'Services Attended',
      value: '12',
      icon: CalendarClock,
      color: 'bg-blue-100 text-blue-700',
    },
    {
      label: 'Check-ins This Month',
      value: '3',
      icon: ClipboardCheck,
      color: 'bg-emerald-100 text-emerald-700',
    },
    {
      label: 'Prayer Requests',
      value: '2',
      icon: Heart,
      color: 'bg-purple-100 text-purple-700',
    },
    {
      label: 'Upcoming Events',
      value: '4',
      icon: Calendar,
      color: 'bg-amber-100 text-amber-700',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {memberName}!</h1>
        <p className="mt-1 text-blue-100">We're glad to have you as part of JHTM Church.</p>
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => navigate('/portal/checkin')}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
          >
            <ClipboardCheck size={18} />
            Check-in Now
          </button>
          <button
            onClick={() => navigate('/portal/prayers')}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-400 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
          >
            <Heart size={18} />
            Submit Prayer Request
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <button
            key={stat.label}
            onClick={() => {
              if (stat.label.includes('Check-ins')) navigate('/portal/attendance');
              else if (stat.label.includes('Prayer')) navigate('/portal/prayers');
              else if (stat.label.includes('Upcoming')) navigate('/portal/events');
              else if (stat.label.includes('Services')) navigate('/portal/attendance');
            }}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
              <div className={`rounded-xl p-3 ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={() => navigate('/portal/profile')}
            className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50"
          >
            <div className="rounded-lg bg-slate-100 p-2">
              <User className="text-slate-600" size={20} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-900">Update Profile</p>
              <p className="text-xs text-slate-500">Keep your info current</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/portal/checkin')}
            className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50"
          >
            <div className="rounded-lg bg-blue-100 p-2">
              <ClipboardCheck className="text-blue-600" size={20} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-900">Check-in</p>
              <p className="text-xs text-slate-500">Mark attendance</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/portal/prayers')}
            className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50"
          >
            <div className="rounded-lg bg-purple-100 p-2">
              <Heart className="text-purple-600" size={20} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-900">Prayer Request</p>
              <p className="text-xs text-slate-500">Share your needs</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/portal/events')}
            className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50"
          >
            <div className="rounded-lg bg-amber-100 p-2">
              <Calendar className="text-amber-600" size={20} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-900">View Events</p>
              <p className="text-xs text-slate-500">Browse upcoming events</p>
            </div>
          </button>
        </div>
      </div>

      {/* Upcoming Services */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Upcoming Services</h2>
          <button
            onClick={() => navigate('/portal/events')}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            View All
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {upcomingServices.map((service) => (
            <div
              key={service.id}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4"
            >
              <div>
                <p className="font-semibold text-slate-900">{service.name}</p>
                <p className="text-sm text-slate-500">
                  {service.date} at {service.time}
                </p>
              </div>
              <button
                onClick={() => navigate('/portal/checkin')}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Check-in
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
