import { createRevisionPdf, type RevisionPdfItem } from "@/lib/revision-pdf";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { answers?: unknown } | null;
  if (!Array.isArray(body?.answers) || body.answers.length === 0) {
    return Response.json({ error: "No revision answers supplied." }, { status: 400 });
  }

  const answers: RevisionPdfItem[] = body.answers.slice(0, 50).map((value) => {
    const item = value && typeof value === "object" ? value as Record<string, unknown> : {};
    const safe = (field: string, fallback: string) => String(item[field] ?? fallback).slice(0, 400);
    return {
      lessonSlug: safe("lessonSlug", "Lesson"),
      activity: safe("activity", "Practice"),
      prompt: safe("prompt", "Review this item"),
      correctAnswer: safe("correctAnswer", "Not supplied"),
      learnerAnswer: safe("learnerAnswer", "No answer")
    };
  });
  const pdf = createRevisionPdf(answers);

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="portulgiza-needs-practice.pdf"',
      "Cache-Control": "no-store"
    }
  });
}
