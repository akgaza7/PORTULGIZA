import { ConnectedStudentProgressDashboard } from "@/components/student-progress-dashboard";
import { redirect } from "next/navigation";
import { getTrialAccess } from "@/lib/trial-access";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const access = await getTrialAccess();
  if (access.state === "signed_out") redirect("/sign-in");
  if (access.state === "expired") redirect("/subscribe-required");
  return (
    <main className="page-shell py-4 sm:py-6">
      <h1 className="sr-only">Learning dashboard</h1>
      <ConnectedStudentProgressDashboard />
    </main>
  );
}
