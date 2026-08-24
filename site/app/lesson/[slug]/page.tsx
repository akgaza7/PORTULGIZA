import { notFound, redirect } from "next/navigation";
import { LessonScreen } from "@/components/lesson-screen";
import { getLessonBySlug } from "@/lib/lesson-data";
import { getTrialAccess } from "@/lib/trial-access";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const access = await getTrialAccess();
  if (access.state === "signed_out") redirect("/sign-up");
  if (access.state === "expired") redirect("/subscribe-required");
  const lesson = getLessonBySlug(slug);

  if (!lesson) {
    notFound();
  }

  return <LessonScreen lesson={lesson} />;
}
