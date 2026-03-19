import React from 'react';
import { Navigate } from 'react-router-dom';
import PortalLayout from '@/components/layout/PortalLayout';

type MemberPortalRouteProps = {
  children: React.ReactNode;
};

export default function MemberPortalRoute({ children }: MemberPortalRouteProps) {
  const token = localStorage.getItem('token');
  
  // For now, we use the same token as admin
  // In the future, we might have separate member tokens or roles
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <PortalLayout>
      {children}
    </PortalLayout>
  );
}
