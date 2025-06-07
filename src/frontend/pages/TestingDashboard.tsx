import React from 'react'
import { TestingDashboard as TestingDashboardComponent } from '@/frontend/features/testing/components/TestingDashboard'
import { useUser } from '@/frontend/components/ui/user-context'
import { Navigate } from 'react-router-dom'
import { Alert, AlertDescription } from '@/frontend/components/ui/alert'
import { Shield } from 'lucide-react'

const TestingDashboard: React.FC = () => {
  const { user } = useUser()

  // Check if user is admin (you can modify this logic based on your admin system)
  const isAdmin = user?.email === 'admin@motionmingle.com' || 
                  user?.email?.includes('admin') || 
                  process.env.NODE_ENV === 'development' // Allow in development

  if (!user) {
    return <Navigate to="/auth/signin" replace />
  }

  if (!isAdmin) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Access denied. The Testing Dashboard is only available to administrators.
            If you need access, please contact your system administrator.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return <TestingDashboardComponent />
}

export default TestingDashboard 