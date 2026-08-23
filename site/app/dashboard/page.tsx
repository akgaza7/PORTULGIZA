import { ConnectedStudentProgressDashboard } from "@/components/student-progress-dashboard";

export default function DashboardPage() {
  return (
    <main className="page-shell py-4 sm:py-6">
      <h1 className="sr-only">Learning dashboard</h1>
      <ConnectedStudentProgressDashboard />
    </main>
  );
}
