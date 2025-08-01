import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { Projects as ProjectsList } from '@/frontend/features/project/components/Projects';
import { AppLayout } from '@/frontend/components/layout/AppLayout';

export default function Projects() {
  const { id } = useParams();
  
  // If there's no project ID, show the projects list
  if (!id) {
    return (
      <AppLayout>
        <ProjectsList />
      </AppLayout>
    );
  }
  
  // If there is a project ID, show the detail view via outlet
  return <Outlet />;
}
