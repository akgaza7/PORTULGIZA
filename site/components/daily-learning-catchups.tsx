import Link from "next/link";

export function DailyLearningCatchups() {
  return (
    <section className="card-surface mt-6 p-5 sm:p-6" aria-labelledby="daily-learning-catchups-heading">
      <h2
        id="daily-learning-catchups-heading"
        className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl"
      >
        Daily learning catch-ups
      </h2>
      <p className="mt-2 leading-7 text-ink/65">Daily learning catch-ups will be emailed to you.</p>
      <div className="mt-4 flex flex-wrap gap-3" aria-label="Daily learning catch-up preference">
        <Link
          href="/sign-up?reminder=yes#daily-learning-preference"
          className="inline-flex min-h-12 w-36 items-center justify-center gap-2 rounded-full border border-portugalGreen/30 bg-portugalGreen/5 px-4 py-2.5 font-semibold text-portugalGreen transition hover:border-portugalGreen hover:bg-portugalGreen/10"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded border border-portugalGreen" aria-hidden="true" />
          Opt in
        </Link>
        <Link
          href="/sign-up?reminder=no#daily-learning-preference"
          className="inline-flex min-h-12 w-36 items-center justify-center gap-2 rounded-full border border-ocean/20 bg-white px-4 py-2.5 font-semibold text-ocean transition hover:border-ocean hover:bg-sky/10"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded border border-ocean/40" aria-hidden="true" />
          Opt out
        </Link>
      </div>
    </section>
  );
}
