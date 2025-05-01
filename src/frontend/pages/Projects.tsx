import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { Projects as ProjectsFeature } from "@/frontend/features/project/components/Projects";

export default function Projects() {
  return (
    <AppLayout>
      <ProjectsFeature />
    </AppLayout>
  );
}
