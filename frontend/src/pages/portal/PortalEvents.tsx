import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, ArrowRight, CheckCircle } from 'lucide-react';

type Event = {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  category: string;
  isRegistered: boolean;
  spotsLeft: number;
  totalSpots: number;
};

const events: Event[] = [
  {
    id: '1',
    name: 'Sunday Worship Service',
    date: 'March 23, 2026',
    time: '9:00 AM - 11:00 AM',
    location: 'Main Sanctuary',
    category: 'Worship',
    isRegistered: true,
    spotsLeft: 50,
    totalSpots: 500,
  },
  {
    id: '2',
    name: 'Midweek Prayer Meeting',
    date: 'March 25, 2026',
    time: '7:00 PM - 8:30 PM',
    location: 'Fellowship Hall',
    category: 'Prayer',
    isRegistered: false,
    spotsLeft: 30,
    totalSpots: 100,
  },
  {
    id: '3',
    name: 'Youth Fellowship Night',
    date: 'March 27, 2026',
    time: '5:00 PM - 8:00 PM',
    location: 'Youth Center',
    category: 'Youth',
    isRegistered: true,
    spotsLeft: 15,
    totalSpots: 50,
  },
  {
    id: '4',
    name: 'Marriage Enrichment Seminar',
    date: 'April 5, 2026',
    time: '9:00 AM - 3:00 PM',
    location: 'Conference Room A',
    category: 'Family',
    isRegistered: false,
    spotsLeft: 8,
    totalSpots: 30,
  },
  {
    id: '5',
    name: 'Easter Sunrise Service',
    date: 'April 20, 2026',
    time: '6:00 AM - 7:30 AM',
    location: 'Church Garden',
    category: 'Worship',
    isRegistered: false,
    spotsLeft: 100,
    totalSpots: 200,
  },
];

export default function PortalEvents() {
  const [eventList, setEventList] = useState(events);
  const [filter, setFilter] = useState<string>('All');

  const categories = ['All', 'Worship', 'Prayer', 'Youth', 'Family', 'Other'];

  const filteredEvents =
    filter === 'All' ? eventList : eventList.filter((e) => e.category === filter);

  const handleRegister = async (eventId: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setEventList((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, isRegistered: true, spotsLeft: e.spotsLeft - 1 } : e
      )
    );
  };

  const handleUnregister = async (eventId: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    setEventList((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, isRegistered: false, spotsLeft: e.spotsLeft + 1 } : e
      )
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Worship':
        return 'bg-sky-100 text-navy';
      case 'Prayer':
        return 'bg-purple-100 text-purple-700';
      case 'Youth':
        return 'bg-amber-100 text-amber-700';
      case 'Family':
        return 'bg-emerald-100 text-emerald-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Church Events</h1>
        <p className="mt-1 text-slate-500">Browse and register for upcoming events</p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              filter === cat
                ? 'bg-navy text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* My Registrations */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">My Registrations</h2>
        <div className="mt-4 space-y-3">
          {eventList
            .filter((e) => e.isRegistered)
            .map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-100 p-2">
                    <CheckCircle className="text-emerald-600" size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{event.name}</p>
                    <p className="text-sm text-slate-500">
                      {event.date} • {event.time}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleUnregister(event.id)}
                  className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Cancel
                </button>
              </div>
            ))}
          {eventList.filter((e) => e.isRegistered).length === 0 && (
            <p className="text-slate-500">You haven't registered for any events yet.</p>
          )}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Upcoming Events</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-sea-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getCategoryColor(event.category)}`}
                >
                  {event.category}
                </span>
                {event.isRegistered && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    <CheckCircle size={12} />
                    Registered
                  </span>
                )}
              </div>

              <h3 className="mt-3 text-lg font-bold text-slate-900">{event.name}</h3>

              <div className="mt-3 space-y-2 text-sm text-slate-500">
                <p className="flex items-center gap-2">
                  <Calendar size={16} />
                  {event.date}
                </p>
                <p className="flex items-center gap-2">
                  <Clock size={16} />
                  {event.time}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin size={16} />
                  {event.location}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <Users size={16} />
                  <span>{event.spotsLeft} spots left</span>
                </div>

                {event.isRegistered ? (
                  <button
                    onClick={() => handleUnregister(event.id)}
                    className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-red-600"
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    onClick={() => handleRegister(event.id)}
                    className="flex items-center gap-1 text-sm font-semibold text-navy hover:text-navy-700"
                  >
                    Register
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredEvents.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">No Events Found</h3>
          <p className="mt-2 text-slate-500">There are no events in this category at the moment.</p>
        </div>
      )}
    </div>
  );
}
