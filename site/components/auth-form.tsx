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
      <h1 className="text-4xl font-bold tracking-tight text-ink">Auth0</h1>
      {configured ? (
        <a
          href={authHref}
          className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-ocean px-5 py-3.5 font-semibold text-white transition hover:bg-ink"
        >
          {isSignUp ? "Continue with Auth0" : "Sign in with Auth0"}
        </a>
      ) : (
        <span className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-ocean px-5 py-3.5 font-semibold text-white">
          Auth0
        </span>
      )}
    </section>
  );
}
