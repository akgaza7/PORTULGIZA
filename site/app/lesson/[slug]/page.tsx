import { notFound } from "next/navigation";
import { LessonScreen } from "@/components/lesson-screen";
import { getLessonBySlug, lessons } from "@/lib/lesson-data";

export function generateStaticParams() {
  return lessons.map((lesson) => ({
    slug: lesson.slug
  }));
}

export default async function LessonPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = getLessonBySlug(slug);

  if (!lesson) {
    notFound();
  }

  return <LessonScreen lesson={lesson} />;
}
