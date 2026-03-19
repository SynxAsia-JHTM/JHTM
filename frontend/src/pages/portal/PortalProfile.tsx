import React, { useState } from 'react';
import { User, Mail, Phone, Calendar, Briefcase, Save } from 'lucide-react';

type MemberGender = 'Male' | 'Female' | 'Other';
type MemberCategory = 'Youth' | 'Pastor' | 'Leader' | 'Member';

const ministries = [
  'Worship',
  'Youth',
  'Media',
  'Children',
  'Ushering',
  'Hospitality',
  'Outreach',
  'None',
] as const;

export default function PortalProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Mock member data - in real app, this would come from API
  const [formData, setFormData] = useState({
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1 (555) 010-1200',
    gender: 'Male' as MemberGender,
    category: 'Member' as MemberCategory,
    birthdate: '1990-03-11',
    ministry: 'Worship',
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="mt-1 text-slate-500">View and update your personal information</p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <User size={18} />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Save size={18} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <User size={40} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{formData.name}</h2>
              <p className="text-slate-500">{formData.category}</p>
              <span className="mt-1 inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                Active Member
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <User size={16} />
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              ) : (
                <p className="rounded-xl bg-slate-50 px-4 py-3 text-slate-900">{formData.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Mail size={16} />
                Email Address
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              ) : (
                <p className="rounded-xl bg-slate-50 px-4 py-3 text-slate-900">{formData.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Phone size={16} />
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              ) : (
                <p className="rounded-xl bg-slate-50 px-4 py-3 text-slate-900">{formData.phone}</p>
              )}
            </div>

            {/* Birthdate */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Calendar size={16} />
                Birthdate
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.birthdate}
                  onChange={(e) => handleChange('birthdate', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              ) : (
                <p className="rounded-xl bg-slate-50 px-4 py-3 text-slate-900">
                  {new Date(formData.birthdate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              )}
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Gender</label>
              {isEditing ? (
                <select
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <p className="rounded-xl bg-slate-50 px-4 py-3 text-slate-900">{formData.gender}</p>
              )}
            </div>

            {/* Ministry */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Briefcase size={16} />
                Ministry
              </label>
              {isEditing ? (
                <select
                  value={formData.ministry}
                  onChange={(e) => handleChange('ministry', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                >
                  {ministries.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              ) : (
                <p className="rounded-xl bg-slate-50 px-4 py-3 text-slate-900">{formData.ministry}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Member Info */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Membership Information</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Member Since</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">January 2020</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Member ID</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">JHTM-001</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Status</p>
            <p className="mt-1 text-lg font-semibold text-emerald-600">Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}
