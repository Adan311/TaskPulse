import React from 'react'
import { TestingDashboard as TestingDashboardComponent } from '@/frontend/features/testing/components/TestingDashboard'
import { useUser } from '@/frontend/components/ui/user-context'
import { Navigate } from 'react-router-dom'
import { AppLayout } from '@/frontend/components/layout/AppLayout'

const TestingDashboard: React.FC = () => {
  const { user } = useUser()

  if (!user) {
    return <Navigate to="/auth/signin" replace />
  }

  return (
    <AppLayout>
      <TestingDashboardComponent />
    </AppLayout>
  )
}

export default TestingDashboard 