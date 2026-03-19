import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Church, User, Mail, Phone, Calendar, Users, ArrowRight, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    visitDate: new Date().toISOString().split('T')[0],
    referredBy: '',
    isFirstVisit: 'yes',
    interests: [] as string[],
    notes: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckbox = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setStep(2);
  };

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white p-8 shadow-xl text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-slate-900">Welcome to JHTM!</h2>
            <p className="mt-2 text-slate-600">
              Thank you for registering. We're excited to have you join us!
            </p>
            <div className="mt-6 rounded-xl bg-blue-50 p-4 text-left">
              <p className="text-sm font-semibold text-blue-900">What is Next?</p>
              <ul className="mt-2 space-y-2 text-sm text-blue-800">
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-blue-600" />
                  Check your email for service times
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-blue-600" />
                  Our welcome team will greet you
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-blue-600" />
                  Feel free to join us for refreshments
                </li>
              </ul>
            </div>
            <div className="mt-6 flex gap-3">
              <Link
                to="/"
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-600 hover:bg-slate-50"
              >
                Back to Home
              </Link>
              <Link
                to="/login"
                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-600 p-2">
              <Church className="text-white" size={24} />
            </div>
            <span className="text-lg font-bold text-slate-900">JHTM Church</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">Already a member?</span>
            <Link
              to="/login"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-2xl px-4 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">Guest Registration</h1>
          <p className="mt-2 text-slate-600">We are excited to have you visit us!</p>
        </div>

        {/* Progress Steps */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
            1
          </div>
          <div className="h-1 w-16 rounded-full bg-blue-600" />
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}
          >
            2
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Personal Information */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <User size={16} />
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <User size={16} />
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  placeholder="Smith"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Mail size={16} />
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Phone size={16} />
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
          </div>

          {/* Visit Information */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Visit Information</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Calendar size={16} />
                  Visit Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.visitDate}
                  onChange={(e) => handleChange('visitDate', e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Users size={16} />
                  Referred By
                </label>
                <input
                  type="text"
                  value={formData.referredBy}
                  onChange={(e) => handleChange('referredBy', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  placeholder="Friend, family, website, etc."
                />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Is this your first visit?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="isFirstVisit"
                    value="yes"
                    checked={formData.isFirstVisit === 'yes'}
                    onChange={(e) => handleChange('isFirstVisit', e.target.value)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="text-slate-600">Yes, this is my first time</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="isFirstVisit"
                    value="no"
                    checked={formData.isFirstVisit === 'no'}
                    onChange={(e) => handleChange('isFirstVisit', e.target.value)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="text-slate-600">No, I've visited before</span>
                </label>
              </div>
            </div>
          </div>

          {/* Interests */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Areas of Interest</h2>
            <p className="mt-1 text-sm text-slate-500">
              Select areas you'd like to learn more about
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                'Worship Team',
                'Youth Ministry',
                'Children Ministry',
                'Media Team',
                'Ushering',
                'Small Groups',
                'Bible Study',
                'Outreach',
              ].map((interest) => (
                <label
                  key={interest}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm font-semibold transition-colors ${
                    formData.interests.includes(interest)
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.interests.includes(interest)}
                    onChange={() => handleCheckbox(interest)}
                    className="hidden"
                  />
                  {interest}
                </label>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Additional Information</h2>
            <div className="mt-4 space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Anything else you'd like us to know?
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                placeholder="Prayer requests, questions, accessibility needs, etc."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl disabled:opacity-50"
          >
            {isSubmitting ? (
              'Submitting...'
            ) : (
              <>
                Submit Registration
                <ArrowRight size={24} />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          By registering, you agree to receive communications from JHTM Church.
        </p>
      </main>
    </div>
  );
}
