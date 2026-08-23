"use client";

import { useState } from "react";
import { getAnswerReview, useProgressState } from "@/lib/storage";

export function RevisionActions() {
  const { progress } = useProgressState();
  const [pdfStatus, setPdfStatus] = useState<"idle" | "working" | "error">("idle");
  const answers = getAnswerReview(progress);
  const needsPractice = answers.needsPractice;
  const whatsappMessage = [
    "Portulgiza - Needs Practice",
    "",
    ...needsPractice.flatMap((answer, index) => [
      `${index + 1}. ${answer.correctAnswer}`,
      `Meaning or question: ${answer.prompt}`,
      `My answer: ${answer.learnerAnswer}`,
      ""
    ])
  ].join("\n");

  const downloadRevisionPdf = async () => {
    if (!needsPractice.length) return;
    setPdfStatus("working");

    try {
      const response = await fetch("/api/revision/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: needsPractice })
      });
      if (!response.ok) throw new Error("PDF generation failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "portulgiza-needs-practice.pdf";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setPdfStatus("idle");
    } catch {
      setPdfStatus("error");
    }
  };

  return (
    <div className="rounded-2xl border border-portugalRed/15 bg-portugalRed/5 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-portugalRed">Revision copies</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!needsPractice.length || pdfStatus === "working"}
          onClick={downloadRevisionPdf}
          className="rounded-full bg-portugalRed px-4 py-2.5 text-xs font-bold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-ink/10 disabled:text-ink/40"
        >
          {pdfStatus === "working" ? "Preparing PDF..." : "Download revision PDF"}
        </button>
        {needsPractice.length ? (
          <a
            href={`https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-portugalGreen px-4 py-2.5 text-xs font-bold text-white transition hover:bg-ink"
          >
            Share on WhatsApp
          </a>
        ) : (
          <span className="rounded-full bg-ink/10 px-4 py-2.5 text-xs font-bold text-ink/35">Share on WhatsApp</span>
        )}
      </div>
      <p className="mt-3 max-w-md text-xs leading-5 text-ink/50">
        Download or open a free, pre-filled WhatsApp revision message using the answers you need to practise.
      </p>
      {pdfStatus === "error" ? (
        <p className="mt-2 text-xs font-semibold text-portugalRed">The PDF could not be prepared. Please try again.</p>
      ) : null}
    </div>
  );
}
