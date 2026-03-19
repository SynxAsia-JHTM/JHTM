import React, { useState } from 'react';
import { CalendarClock, TrendingUp, Filter, Download } from 'lucide-react';

type AttendanceRecord = {
  id: string;
  serviceName: string;
  date: string;
  time: string;
  status: 'Present' | 'Late' | 'Absent';
};

const attendanceHistory: AttendanceRecord[] = [
  {
    id: '1',
    serviceName: 'Sunday Worship',
    date: 'March 16, 2026',
    time: '9:15 AM',
    status: 'Present',
  },
  {
    id: '2',
    serviceName: 'Prayer Meeting',
    date: 'March 11, 2026',
    time: '7:05 PM',
    status: 'Present',
  },
  {
    id: '3',
    serviceName: 'Sunday Worship',
    date: 'March 9, 2026',
    time: '9:22 AM',
    status: 'Late',
  },
  {
    id: '4',
    serviceName: 'Youth Service',
    date: 'March 6, 2026',
    time: '5:00 PM',
    status: 'Present',
  },
  {
    id: '5',
    serviceName: 'Sunday Worship',
    date: 'March 2, 2026',
    time: '9:00 AM',
    status: 'Present',
  },
  {
    id: '6',
    serviceName: 'Prayer Meeting',
    date: 'Feb 25, 2026',
    time: '7:00 PM',
    status: 'Present',
  },
  {
    id: '7',
    serviceName: 'Sunday Worship',
    date: 'Feb 23, 2026',
    time: '9:10 AM',
    status: 'Present',
  },
  { id: '8', serviceName: 'Youth Service', date: 'Feb 20, 2026', time: '5:15 PM', status: 'Late' },
  {
    id: '9',
    serviceName: 'Sunday Worship',
    date: 'Feb 16, 2026',
    time: '9:00 AM',
    status: 'Absent',
  },
  {
    id: '10',
    serviceName: 'Prayer Meeting',
    date: 'Feb 11, 2026',
    time: '7:00 PM',
    status: 'Present',
  },
];

export default function PortalAttendance() {
  const [filter, setFilter] = useState<'All' | 'Present' | 'Late' | 'Absent'>('All');

  const filteredRecords =
    filter === 'All' ? attendanceHistory : attendanceHistory.filter((r) => r.status === filter);

  const stats = {
    total: attendanceHistory.length,
    present: attendanceHistory.filter((r) => r.status === 'Present').length,
    late: attendanceHistory.filter((r) => r.status === 'Late').length,
    absent: attendanceHistory.filter((r) => r.status === 'Absent').length,
    rate: Math.round(
      (attendanceHistory.filter((r) => r.status !== 'Absent').length / attendanceHistory.length) *
        100
    ),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return 'bg-emerald-100 text-emerald-700';
      case 'Late':
        return 'bg-amber-100 text-amber-700';
      case 'Absent':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Attendance</h1>
          <p className="mt-1 text-slate-500">View your service attendance history</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          <Download size={18} />
          Export History
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Total Services</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <div className="rounded-xl bg-blue-100 p-3">
              <CalendarClock className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Present</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.present}</p>
            </div>
            <div className="rounded-xl bg-emerald-100 p-3">
              <TrendingUp className="text-emerald-600" size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Late Arrivals</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">{stats.late}</p>
            </div>
            <div className="rounded-xl bg-amber-100 p-3">
              <CalendarClock className="text-amber-600" size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Attendance Rate</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stats.rate}%</p>
            </div>
            <div className="rounded-xl bg-purple-100 p-3">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="text-slate-400" size={20} />
        <span className="text-sm font-semibold text-slate-600">Filter:</span>
        {(['All', 'Present', 'Late', 'Absent'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Attendance Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/60">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Service
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Date
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Check-in Time
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="transition-colors hover:bg-slate-50/60">
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-900">
                      {record.serviceName}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{record.date}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{record.time}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(
                        record.status
                      )}`}
                    >
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
