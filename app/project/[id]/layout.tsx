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
      <div className="flex min-h-screen">
        <PhaseNavigator projectId={id} />
        <div className="flex min-h-screen flex-1 flex-col">{children}</div>
      </div>
    </WorkflowProvider>
  );
}
