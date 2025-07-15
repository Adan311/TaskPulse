import React from 'react';
import { DashboardLayout } from '@/frontend/features/dashboard/DashboardLayout';
import LandingPage from './LandingPage';
import { useAuthCheck } from '@/frontend/hooks/useAuthCheck';
import { PageLoading } from '@/frontend/components/ui/loading';

const Home = () => {
  const { isAuthenticated, loading } = useAuthCheck();

  if (loading) {
    return <PageLoading />;
  }

  // Show landing page for non-authenticated users
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // Show dashboard for authenticated users
  return <DashboardLayout />;
};

export default Home;
