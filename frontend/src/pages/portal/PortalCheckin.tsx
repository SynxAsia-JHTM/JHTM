import React, { useState } from 'react';
import { ClipboardCheck, QrCode, CheckCircle, Clock, MapPin, Calendar } from 'lucide-react';

type Service = {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  isCheckedIn: boolean;
  canCheckIn: boolean;
};

const upcomingServices: Service[] = [
  {
    id: '1',
    name: 'Sunday Worship',
    date: 'March 23, 2026',
    time: '9:00 AM',
    location: 'Main Sanctuary',
    isCheckedIn: false,
    canCheckIn: true,
  },
  {
    id: '2',
    name: 'Prayer Meeting',
    date: 'March 25, 2026',
    time: '7:00 PM',
    location: 'Fellowship Hall',
    isCheckedIn: false,
    canCheckIn: true,
  },
  {
    id: '3',
    name: 'Youth Service',
    date: 'March 27, 2026',
    time: '5:00 PM',
    location: 'Youth Center',
    isCheckedIn: false,
    canCheckIn: true,
  },
];

const recentCheckins = [
  { id: 1, service: 'Sunday Worship', date: 'March 16, 2026', time: '9:15 AM' },
  { id: 2, service: 'Prayer Meeting', date: 'March 11, 2026', time: '7:05 PM' },
  { id: 3, service: 'Sunday Worship', date: 'March 9, 2026', time: '9:22 AM' },
];

export default function PortalCheckin() {
  const [services, setServices] = useState(upcomingServices);
  const [showQR, setShowQR] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleCheckIn = async (serviceId: string) => {
    setIsLoading(serviceId);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, isCheckedIn: true, canCheckIn: false } : s))
    );
    setIsLoading(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Service Check-in</h1>
        <p className="mt-1 text-slate-500">Check in to upcoming services</p>
      </div>

      {/* Quick Check-in Options */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Manual Check-in */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-sky-100 p-3">
              <ClipboardCheck className="text-navy" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Manual Check-in</h3>
              <p className="text-sm text-slate-500">Tap to check in</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {services.map((service) => (
              <div
                key={service.id}
                className={`rounded-xl border p-4 ${
                  service.isCheckedIn
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{service.name}</p>
                    <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {service.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {service.time}
                      </span>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                      <MapPin size={14} />
                      {service.location}
                    </p>
                  </div>

                  {service.isCheckedIn ? (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle size={20} />
                      <span className="text-sm font-semibold">Checked In</span>
                    </div>
                  ) : service.canCheckIn ? (
                    <button
                      onClick={() => handleCheckIn(service.id)}
                      disabled={isLoading === service.id}
                      className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-600 disabled:opacity-50"
                    >
                      {isLoading === service.id ? 'Checking...' : 'Check In'}
                    </button>
                  ) : (
                    <span className="text-sm text-slate-400">Not available</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* QR Code Check-in */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-100 p-3">
              <QrCode className="text-purple-600" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">QR Code Check-in</h3>
              <p className="text-sm text-slate-500">Show this code at the entrance</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center">
            {showQR ? (
              <div className="rounded-2xl bg-white p-4 shadow-inner">
                <div className="h-48 w-48 rounded-lg bg-slate-100 flex items-center justify-center">
                  {/* QR Code placeholder - in real app would generate actual QR */}
                  <div className="text-center">
                    <QrCode size={64} className="mx-auto text-slate-400" />
                    <p className="mt-2 text-xs text-slate-500">JHTM-001</p>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowQR(true)}
                className="rounded-xl border-2 border-dashed border-slate-300 p-8 text-center hover:border-purple-400 hover:bg-purple-50"
              >
                <QrCode size={48} className="mx-auto text-slate-400" />
                <p className="mt-2 text-sm font-semibold text-slate-600">Tap to show QR Code</p>
              </button>
            )}

            {showQR && (
              <button
                onClick={() => setShowQR(false)}
                className="mt-4 text-sm font-semibold text-slate-500 hover:text-slate-700"
              >
                Hide QR Code
              </button>
            )}
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-600">
              <strong>Tip:</strong> Show this QR code to the ushers when you arrive at the service
              for quick check-in.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Check-ins */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Recent Check-ins</h3>
        <div className="mt-4 space-y-3">
          {recentCheckins.map((checkin) => (
            <div
              key={checkin.id}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-100 p-2">
                  <CheckCircle className="text-emerald-600" size={20} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{checkin.service}</p>
                  <p className="text-sm text-slate-500">{checkin.date}</p>
                </div>
              </div>
              <span className="text-sm font-medium text-slate-500">{checkin.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
