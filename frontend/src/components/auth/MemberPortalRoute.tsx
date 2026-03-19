import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import PortalLayout from '@/components/layout/PortalLayout';

export default function MemberPortalRoute() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  // For now, we use the same token as admin
  // In the future, we might have separate member tokens or roles
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <PortalLayout>
      <Outlet />
    </PortalLayout>
  );
}
