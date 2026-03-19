import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MemberPortalRoute from './components/auth/MemberPortalRoute';
import AppShell from './components/layout/AppShell';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardHome from './pages/DashboardHome';
import Members from './pages/Members';
import Events from './pages/Events';
import Attendance from './pages/Attendance';
import About from './pages/About';

// Member Portal Pages
import PortalDashboard from './pages/portal/PortalDashboard';
import PortalProfile from './pages/portal/PortalProfile';
import PortalCheckin from './pages/portal/PortalCheckin';
import PortalAttendance from './pages/portal/PortalAttendance';
import PortalPrayers from './pages/portal/PortalPrayers';
import PortalEvents from './pages/portal/PortalEvents';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Admin Dashboard Routes (existing) */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/members" element={<Members />} />
          <Route path="/events" element={<Events />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/about" element={<About />} />
        </Route>

        {/* Member Portal Routes (new) */}
        <Route
          element={
            <MemberPortalRoute>
              <React.Fragment />
            </MemberPortalRoute>
          }
        >
          <Route path="/portal" element={<PortalDashboard />} />
          <Route path="/portal/profile" element={<PortalProfile />} />
          <Route path="/portal/checkin" element={<PortalCheckin />} />
          <Route path="/portal/attendance" element={<PortalAttendance />} />
          <Route path="/portal/prayers" element={<PortalPrayers />} />
          <Route path="/portal/events" element={<PortalEvents />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
