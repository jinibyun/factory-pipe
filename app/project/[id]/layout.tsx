import { WorkflowProvider } from "@/contexts/workflow-context";
import { PhaseNavigator } from "@/components/phase-navigator";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <WorkflowProvider projectId={id}>
      <div className="relative flex min-h-screen">
        {/* Background effects */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 bg-radial-gradient"
        />
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 bg-grid-pattern"
        />
        
        {/* Sidebar */}
        <PhaseNavigator projectId={id} />
        
        {/* Main content */}
        <div className="relative flex min-h-screen flex-1 flex-col">
          {children}
        </div>
      </div>
    </WorkflowProvider>
  );
}
