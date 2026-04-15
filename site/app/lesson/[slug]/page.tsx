import { notFound } from "next/navigation";
import { LessonScreen } from "@/components/lesson-screen";
import { getLessonBySlug, lessons } from "@/lib/lesson-data";

export function generateStaticParams() {
  return lessons.map((lesson) => ({
    slug: lesson.slug
  }));
}

export default function LessonPage({
  params
}: {
  params: { slug: string };
}) {
  const lesson = getLessonBySlug(params.slug);

  if (!lesson) {
    notFound();
  }

  return <LessonScreen lesson={lesson} />;
}
