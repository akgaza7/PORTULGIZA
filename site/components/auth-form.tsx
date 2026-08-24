type AuthFormProps = {
  mode: "sign-in" | "sign-up";
  configured: boolean;
};

export function AuthForm({ mode, configured }: AuthFormProps) {
  const isSignUp = mode === "sign-up";
  const authHref = isSignUp
    ? "/auth/login?screen_hint=signup&returnTo=/account"
    : "/auth/login?returnTo=/account";

  return (
    <section className="card-surface mx-auto max-w-lg p-8 text-center sm:p-10">
      <h1 className="text-4xl font-bold tracking-tight text-ink">
        {isSignUp ? "START is free for 14 days" : "Subscriber sign in"}
      </h1>
      <p className="mx-auto mt-4 max-w-md leading-7 text-ink/65">
        {isSignUp
          ? "Add your email address and mobile number. No card required. We’ll send a verification code to your email."
          : "Sign in to continue your lessons and view your progress."}
      </p>
      {configured ? (
        <a
          href={authHref}
          className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-ocean px-5 py-3.5 font-semibold text-white transition hover:bg-ink"
        >
          {isSignUp ? "Start free trial" : "Sign in"}
        </a>
      ) : (
        <span
          aria-disabled="true"
          className="mt-7 inline-flex w-full cursor-not-allowed items-center justify-center rounded-full bg-ocean/45 px-5 py-3.5 font-semibold text-white"
        >
          {isSignUp ? "Start free trial" : "Sign in"}
        </span>
      )}
    </section>
  );
}
